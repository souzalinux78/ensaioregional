import PDFDocument from 'pdfkit'
import dayjs from 'dayjs'
import path from 'path'
import fs from 'fs'
import { prisma } from '../../infra/database/prisma.client'

// --- DEFINIÇÃO DA ESTRUTURA OFICIAL CCB ---
const ESTRUTURA_OFICIAL = [
    {
        categoria: 'CORDAS',
        instrumentos: ['Violino', 'Viola', 'Violoncello']
    },
    {
        categoria: 'MADEIRAS',
        instrumentos: [
            'Flauta', 'Flauta Alto', 'Flauta Baixo', 'Oboé', 'Oboé D\'Amore',
            'Corne Inglês', 'Fagote', 'Contra-Fagote', 'Clarinete', 'Clarinete Alto',
            'Clarinete Contra-Alto', 'Clarinete Baixo', 'Clarinete Contra-Baixo',
            'Saxofone Soprano', 'Saxofone Alto', 'Saxofone Tenor', 'Saxofone Barítono',
            'Saxofone Baixo', 'Acordeon'
        ]
    },
    {
        categoria: 'METAIS',
        instrumentos: [
            'Trompete', 'Cornet', 'Pocket', 'Flugel Horn', 'Trompa',
            'Trombonito', 'Trombone', 'Barítono De Pisto', 'Sax Horn / Genes',
            'Bombardino / Euphonio', 'Tuba'
        ]
    }
]

// Mapeamento para normalização e contagem correta nos campos oficiais
const INSTRUMENTO_MAP: Record<string, string> = {
    'VIOLINO': 'Violino', 'VIOLA': 'Viola', 'VIOLONCELO': 'Violoncello', 'VIOLONCELLO': 'Violoncello',
    'FLAUTA': 'Flauta', 'OBOE': 'Oboé', 'FAGOTE': 'Fagote', 'CLARINETE': 'Clarinete', 'CLARINETA': 'Clarinete',
    'SAXOFONE SOPRANO': 'Saxofone Soprano', 'SAXOFONE ALTO': 'Saxofone Alto', 'SAXOFONE TENOR': 'Saxofone Tenor',
    'SAXOFONE BARITONO': 'Saxofone Barítono', 'TROMPETE': 'Trompete', 'TROMBONE': 'Trombone', 'TUBA': 'Tuba',
    'BOMBARDINO': 'Bombardino / Euphonio', 'EUPHONIO': 'Bombardino / Euphonio', 'TROMPA': 'Trompa',
    'ORGAO': 'ÓRGÃO', 'ÓRGÃO': 'ÓRGÃO'
}

export class PdfRelatorioService {
    async gerarPdf(ensaioId: string, tenantId: string): Promise<Buffer> {
        const ensaio = await prisma.ensaioRegional.findFirst({
            where: { id: ensaioId, tenantId }
        })
        if (!ensaio) throw new Error('Evento não encontrado')

        const registros = await prisma.registroPresenca.findMany({
            where: { ensaioRegionalId: ensaioId, tenantId },
            include: { instrumento: { select: { nome: true } } }
        })

        // --- PROCESSAMENTO DE DADOS ---
        const counts: Record<string, number> = {}
        const minCounts: Record<string, number> = {
            ANCIAO: 0, DIACONO: 0, COOPERADOR: 0, COOPERADOR_JOVENS: 0,
            REGIONAL: 0, EXAMINADORA: 0, LOCAL: 0, INSTRUTOR: 0
        }
        let totalOrganistas = 0
        let totalMusicosSoproCordas = 0

        registros.forEach(r => {
            const func = r.funcaoMinisterio.toUpperCase()
            const inst = (r.instrumento?.nome || r.instrumentoOutro || '').toUpperCase().trim()

            // 1. Ministério
            if (func.includes('ANCIAO') || func.includes('ANCIÃO')) minCounts.ANCIAO++
            else if (func.includes('DIACONO') || func.includes('DIÁCONO')) minCounts.DIACONO++
            else if (func.includes('COOP') && !func.includes('JOVEN')) minCounts.COOPERADOR++
            else if (func.includes('JOVEN')) minCounts.COOPERADOR_JOVENS++
            else if (func.includes('REGIONAL')) minCounts.REGIONAL++
            else if (func.includes('EXAMINADORA')) minCounts.EXAMINADORA++
            else if (func.includes('LOCAL')) minCounts.LOCAL++
            else if (func.includes('INSTRUTOR')) minCounts.INSTRUTOR++

            // 2. Instrumentos
            const isOrgao = inst.includes('ÓRGÃO') || inst.includes('ORGAO') || func === 'ORGANISTA'
            if (isOrgao) {
                totalOrganistas++
            } else if (inst) {
                totalMusicosSoproCordas++
                let matched = false
                for (const [raw, official] of Object.entries(INSTRUMENTO_MAP)) {
                    if (inst.includes(raw)) {
                        counts[official] = (counts[official] || 0) + 1
                        matched = true
                        break
                    }
                }
                if (!matched) {
                    for (const cat of ESTRUTURA_OFICIAL) {
                        for (const name of cat.instrumentos) {
                            if (inst.includes(name.toUpperCase())) {
                                counts[name] = (counts[name] || 0) + 1
                                matched = true
                                break
                            }
                        }
                        if (matched) break
                    }
                }
            }
        })

        const totalGeral = totalMusicosSoproCordas + totalOrganistas

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 40, size: 'A4' })
            const buffers: Buffer[] = []
            doc.on('data', chunk => buffers.push(chunk))
            doc.on('end', () => resolve(Buffer.concat(buffers)))
            doc.on('error', reject)

            const startX = 50
            let y = 40
            const tableW = 500

            // 1. CABEÇALHO
            doc.rect(startX, y, tableW, 45).lineWidth(1).stroke()

            // Tenta encontrar a logo com diferentes nomes possíveis
            const possibleLogos = ['logo_ccb.png', 'logo.png']
            let logoPath = ''
            for (const name of possibleLogos) {
                const p = path.resolve(process.cwd(), 'public', name)
                if (fs.existsSync(p)) {
                    logoPath = p
                    break
                }
            }

            if (logoPath) {
                doc.image(logoPath, startX + 5, y + 5, { width: 80 })
            } else {
                doc.rect(startX + 5, y + 5, 80, 35).lineWidth(0.5).stroke()
                doc.fontSize(6).text('CONGREGAÇÃO\nCRISTÃ NO BRASIL', startX + 5, y + 15, { width: 80, align: 'center' })
            }

            doc.moveTo(startX + 90, y).lineTo(startX + 90, y + 45).stroke()
            doc.moveTo(startX + 90, y + 15).lineTo(startX + tableW, y + 15).stroke()
            doc.moveTo(startX + 350, y + 15).lineTo(startX + 350, y + 45).stroke()

            doc.font('Helvetica-Bold').fontSize(10).text('SECRETARIA DA MÚSICA - ATIBAIA', startX + 90, y + 4, { width: 410, align: 'center' })
            const local = (ensaio as any).cidadeEvento || ensaio.localEvento || 'REGIONAL'
            doc.fontSize(12).text(local.toUpperCase(), startX + 95, y + 23)
            doc.fontSize(11).text(dayjs(ensaio.dataEvento).format('DD/MM/YY'), startX + 350, y + 23, { width: 150, align: 'center' })
            y += 55

            // 2. ATENDIMENTO
            doc.rect(startX, y, tableW, 25).stroke()
            doc.moveTo(startX, y + 10).lineTo(startX + tableW, y + 10).stroke()
            doc.font('Helvetica-Bold').fontSize(7).text('ATENDIMENTO', startX, y + 2, { width: tableW, align: 'center' })

            doc.moveTo(startX + 45, y + 10).lineTo(startX + 45, y + 25).stroke()
            doc.moveTo(startX + 280, y + 10).lineTo(startX + 280, y + 25).stroke()
            doc.moveTo(startX + 330, y + 10).lineTo(startX + 330, y + 25).stroke()

            doc.font('Helvetica').fontSize(8).text('Ancião', startX + 2, y + 14)
            doc.font('Helvetica-Bold').fontSize(9).text(ensaio.anciaoAtendimento || '', startX + 50, y + 14)
            doc.font('Helvetica').fontSize(8).text('Regional', startX + 282, y + 14)
            const reg1 = (ensaio as any).regionalPrincipal || ensaio.regionalRegente || ''
            doc.font('Helvetica-Bold').fontSize(9).text(reg1, startX + 335, y + 14)
            y += 35

            // 3. MINISTÉRIO
            doc.rect(startX, y, tableW, 65).stroke()
            doc.moveTo(startX, y + 10).lineTo(startX + tableW, y + 10).stroke()
            doc.font('Helvetica-Bold').fontSize(7).text('PARTICIPAÇÃO MINISTÉRIO', startX, y + 2, { width: tableW, align: 'center' })

            const colW = tableW / 2
            const rowH = 13.5
            doc.moveTo(startX + colW, y + 10).lineTo(startX + colW, y + 65).stroke()

            const minList = [
                { l: 'Ancião', k: 'ANCIAO' }, { l: 'Encarregado Regional', k: 'REGIONAL' },
                { l: 'Diácono', k: 'DIACONO' }, { l: 'Examinadora', k: 'EXAMINADORA' },
                { l: 'Coop. Ofício Ministerial', k: 'COOPERADOR' }, { l: 'Encarregado Local', k: 'LOCAL' },
                { l: 'Coop. Jovens e Menores', k: 'COOPERADOR_JOVENS' }, { l: 'Instrutor', k: 'INSTRUTOR' }
            ]

            minList.forEach((m, i) => {
                const rx = startX + (i % 2 === 0 ? 0 : colW)
                const ry = y + 10 + Math.floor(i / 2) * rowH
                doc.rect(rx, ry, 35, rowH).stroke()
                doc.font('Helvetica-Bold').fontSize(9).text(String((minCounts as any)[m.k]), rx, ry + 3, { width: 35, align: 'center' })
                doc.font('Helvetica').fontSize(8).text(m.l, rx + 40, ry + 3)
            })
            y += 75

            // 4. MÚSICOS
            const musiciansH = 430
            doc.rect(startX, y, tableW, musiciansH).stroke()
            doc.moveTo(startX, y + 10).lineTo(startX + tableW, y + 10).stroke()
            doc.font('Helvetica-Bold').fontSize(7).text('PARTICIPAÇÃO MÚSICOS', startX, y + 2, { width: tableW, align: 'center' })

            const qW = 35, nW = 280, pW = 60
            doc.moveTo(startX + qW, y + 10).lineTo(startX + qW, y + musiciansH).stroke()
            doc.moveTo(startX + nW, y + 10).lineTo(startX + nW, y + musiciansH).stroke()
            doc.moveTo(startX + nW + pW, y + 10).lineTo(startX + nW + pW, y + musiciansH).stroke()

            let iy = y + 10
            const iH = 12.7

            ESTRUTURA_OFICIAL.forEach((cat, idx) => {
                const startCatY = iy
                const catTotal = cat.instrumentos.reduce((a, b) => a + (counts[b] || 0), 0)
                const pct = totalMusicosSoproCordas > 0 ? ((catTotal / totalMusicosSoproCordas) * 100).toFixed(0) + '%' : '0%'

                cat.instrumentos.forEach(name => {
                    doc.rect(startX, iy, qW, iH).stroke()
                    if (counts[name]) doc.font('Helvetica-Bold').fontSize(9).text(String(counts[name]), startX, iy + 2, { width: qW, align: 'center' })
                    doc.rect(startX + qW, iy, nW - qW, iH).stroke()
                    doc.font('Helvetica').fontSize(8.5).text(name, startX + qW + 5, iy + 2)
                    iy += iH
                })

                const midY = startCatY + (iy - startCatY) / 2
                doc.font('Helvetica-Bold').fontSize(10).text(pct, startX + nW, midY - 5, { width: pW, align: 'center' })

                // Texto Rotacionado da Categoria
                doc.save()
                const catName = cat.categoria
                doc.font('Helvetica-Bold').fontSize(10)
                const textWidth = doc.widthOfString(catName)
                const centerX = startX + nW + pW + (tableW - (nW + pW)) / 2

                doc.translate(centerX, midY)
                doc.rotate(-90)
                doc.text(catName, -textWidth / 2, -4)
                doc.restore()
                if (idx < 2) doc.moveTo(startX, iy).lineTo(startX + tableW, iy).stroke()
            })
            y += musiciansH + 10

            // 5. TOTAIS
            doc.rect(startX, y, tableW, 45).stroke()
            doc.moveTo(startX, y + 10).lineTo(startX + tableW, y + 10).stroke()
            doc.font('Helvetica-Bold').fontSize(7).text('TOTAIS DE MÚSICOS E ORGANISTAS', startX, y + 2, { width: tableW, align: 'center' })
            doc.moveTo(startX + 75, y + 10).lineTo(startX + 75, y + 45).stroke()
            const th = 11.6

            doc.rect(startX, y + 10, 75, th).stroke()
            doc.fillColor('#cc0000').font('Helvetica-Bold').fontSize(10).text(String(totalOrganistas), startX, y + 11.5, { width: 75, align: 'center' })
            doc.fillColor('#000').font('Helvetica').text('Organista', startX + 80, y + 11.5)

            doc.rect(startX, y + 10 + th, 75, th).stroke()
            doc.fillColor('#cc0000').font('Helvetica-Bold').text(String(totalMusicosSoproCordas), startX, y + 11.5 + th, { width: 75, align: 'center' })
            doc.fillColor('#000').font('Helvetica').text('Músico', startX + 80, y + 11.5 + th)

            doc.rect(startX, y + 10 + th * 2, 75, th + 1).stroke()
            doc.fillColor('#cc0000').font('Helvetica-Bold').fontSize(11).text(String(totalGeral), startX, y + 12 + th * 2, { width: 75, align: 'center' })
            doc.fillColor('#000').text('TOTAL GERAL', startX + 80, y + 12 + th * 2)

            doc.end()
        })
    }

    async gerarAnaliticoPdf(ensaioId: string, tenantId: string): Promise<Buffer> {
        const ensaio = await prisma.ensaioRegional.findFirst({ where: { id: ensaioId, tenantId } })
        if (!ensaio) throw new Error('Evento não encontrado')

        const registros = await prisma.registroPresenca.findMany({
            where: { ensaioRegionalId: ensaioId, tenantId },
            include: {
                cidade: {
                    select: {
                        nomeCidade: true,
                        nomeBairro: true,
                        nomeExibicao: true
                    }
                }
            }
        })

        const cityGroups: Record<string, { total: number, bairros: Record<string, number> }> = {}

        registros.forEach((r: any) => {
            const cityName = r.cidade.nomeCidade || 'DESCONHECIDO'
            const bairroName = r.cidade.nomeBairro || 'CENTRO'

            if (!cityGroups[cityName]) {
                cityGroups[cityName] = { total: 0, bairros: {} }
            }
            cityGroups[cityName].total++
            cityGroups[cityName].bairros[bairroName] = (cityGroups[cityName].bairros[bairroName] || 0) + 1
        })

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 40, size: 'A4' })
            const buffers: Buffer[] = []
            doc.on('data', c => buffers.push(c))
            doc.on('end', () => resolve(Buffer.concat(buffers)))
            doc.on('error', reject)

            doc.font('Helvetica-Bold').fontSize(16).text('RELATÓRIO ANALÍTICO POR LOCALIDADE', { align: 'center' })
            doc.fontSize(10).text(ensaio.nome.toUpperCase(), { align: 'center' })
            doc.fontSize(8).text(dayjs(ensaio.dataEvento).format('DD/MM/YYYY'), { align: 'center' })
            doc.moveDown(2)

            Object.entries(cityGroups)
                .sort((a, b) => b[1].total - a[1].total)
                .forEach(([city, data]) => {
                    doc.font('Helvetica-Bold').fontSize(12).text(`${city}: ${data.total} músicos`)

                    Object.entries(data.bairros)
                        .sort((a, b) => b[1] - a[1])
                        .forEach(([bairro, count]) => {
                            doc.font('Helvetica').fontSize(10).text(`  • ${bairro}: ${count}`, { indent: 20 })
                        })

                    doc.moveDown(0.5)
                })

            doc.end()
        })
    }
}
