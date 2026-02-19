const fs = require('fs');
const { execSync } = require('child_process');

try {
    console.log('Gerando dump do Prisma...');
    const dump = execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', { encoding: 'utf8' });

    console.log('Adicionando cabeçalho de criação de banco...');
    const fullDump = `CREATE DATABASE IF NOT EXISTS ensaioregional_db;\nUSE ensaioregional_db;\n\n${dump}`;

    fs.writeFileSync('../dump_banco.sql', fullDump, 'utf8');
    console.log('Dump gerado com sucesso em ../dump_banco.sql');
} catch (e) {
    console.error('Erro ao gerar dump:', e.message);
    process.exit(1);
}
