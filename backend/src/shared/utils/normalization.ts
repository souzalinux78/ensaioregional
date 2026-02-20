
export function normalizeString(text: string): string {
    return text
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, ' ')
}

export function normalizeInstrumentName(name: string): string {
    const normalized = normalizeString(name)

    // Official CCB Mappings/Corrections
    const mappings: Record<string, string> = {
        'VIOLONCELO': 'VIOLONCELLO',
        'OBOE': 'OBOÉ', // For display we might want accents, but for grouping we use the normalized key
        'ORGAO': 'ÓRGÃO',
        'TUBA': 'TUBA',
        'EUFONIO': 'EUPHÔNIO',
        'BOMBARDINO': 'BOMBARDINO',
        'SAXOFONE': 'SAXOFONE',
        'CLARINETA': 'CLARINETE',
        'FLAUTA TRANSVERSAL': 'FLAUTA',
    }

    // Apply synonyms/corrections
    for (const [key, value] of Object.entries(mappings)) {
        const normKey = normalizeString(key)
        if (normalized === normKey) return value.toUpperCase() // Keep consistency in upper for storage
    }

    return normalized
}

export function parseCidade(text: string): { cidade: string; bairro: string; exibicao: string } {
    const normalized = normalizeString(text)
    const parts = normalized.split('-').map(p => p.trim())

    const cidade = parts[0] || 'DESCONHECIDO'
    const bairro = parts.length > 1 ? parts.slice(1).join(' - ') : 'CENTRO'
    const exibicao = normalized

    return { cidade, bairro, exibicao }
}
