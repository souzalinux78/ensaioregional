
const { Blob } = require('node:buffer');

async function run() {
    try {
        console.log('--- CIDADES & INSTRUMENTOS MODULE TEST ---');

        // Helpers
        async function request(path, method, body, token, isFormData = false) {
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            if (!isFormData && body) headers['Content-Type'] = 'application/json';

            const options = {
                method,
                headers,
                body: isFormData ? body : (body ? JSON.stringify(body) : null)
            };

            try {
                const res = await fetch(`http://127.0.0.1:3333${path}`, options);
                let responseBody = await res.text();
                try { responseBody = JSON.parse(responseBody); } catch (e) { }

                return {
                    statusCode: res.status,
                    body: responseBody
                };
            } catch (err) {
                console.error(`Request Failed: ${method} ${path}`, err);
                if (err.cause) console.error('Cause:', err.cause);
                throw err;
            }
        }

        // 1. Login Admin
        console.log('1. Login Admin...');
        const adminLogin = await request('/auth/login', 'POST', { email: 'admin@test.com', password: '123456' });
        if (adminLogin.statusCode !== 200) throw new Error('Admin login failed');
        const adminToken = adminLogin.body.accessToken;

        // 2. Login User
        console.log('2. Login User...');
        const userLogin = await request('/auth/login', 'POST', { email: 'user@test.com', password: '123456' });
        if (userLogin.statusCode !== 200) throw new Error('User login failed');
        const userToken = userLogin.body.accessToken;

        // 3. User access denied
        console.log('3. User access denied...');
        const denied = await request('/admin/cidades', 'GET', null, userToken);
        if (denied.statusCode !== 403) throw new Error('User accessed admin route');
        console.log('   Access denied as expected.');

        // 4. Create Cidade
        console.log('4. Create Cidade (Normalizing check)...');
        const uniqueName = `Campinas-${Date.now()}`;
        const normalizedName = uniqueName.toUpperCase();

        const createRes = await request('/admin/cidades', 'POST', { nome: `  ${uniqueName}  ` }, adminToken);
        if (createRes.statusCode !== 201) throw new Error('Create failed: ' + JSON.stringify(createRes.body));
        if (createRes.body.nome !== normalizedName) throw new Error(`Normalization failed: Got ${createRes.body.nome}, Expected ${normalizedName}`);
        const cidadeId = createRes.body.id;
        console.log(`   Created ${normalizedName}.`);

        // 5. Duplicate Check (Idempotency)
        console.log('5. Idempotency Check...');
        const dupRes = await request('/admin/cidades', 'POST', { nome: uniqueName }, adminToken);
        if (dupRes.statusCode !== 201 && dupRes.statusCode !== 200) throw new Error(`Idempotency failed. Status: ${dupRes.statusCode}`);
        if (dupRes.body.id !== cidadeId) throw new Error('Idempotency returned different ID');
        console.log('   Idempotency verified (Duplicate returned existing).');

        // 6. Soft Delete
        console.log('6. Soft Delete...');
        const delRes = await request(`/admin/cidades/${cidadeId}`, 'DELETE', null, adminToken);
        if (delRes.statusCode !== 204) throw new Error('Delete failed. Status: ' + delRes.statusCode + ' Body: ' + JSON.stringify(delRes.body));

        // Check it is gone from list
        const listRes = await request('/admin/cidades', 'GET', null, adminToken);
        if (listRes.body.find(c => c.id === cidadeId)) throw new Error('Soft deleted item still in list');
        console.log('   Soft deleted.');

        // 7. Restore via Create
        console.log('7. Restore via Create...');
        const restoreRes = await request('/admin/cidades', 'POST', { nome: normalizedName }, adminToken);
        if (restoreRes.statusCode !== 201) throw new Error('Restore failed');
        if (restoreRes.body.id !== cidadeId) console.log('   Warning: ID changed on restore?');
        console.log('   Restored.');

        // 8. CSV Import
        console.log('8. CSV Import...');
        const csvUnique = `Campinas-${Date.now()}`;
        const csvValinhos = `Valinhos-${Date.now()}`;
        // Create CSV content: ExistingName (active), NewName, ExistingName
        // ExistingName is normalizedName (active from Restore)
        const csvContent = `nome\n${normalizedName}\n${csvValinhos}\n${normalizedName}`;
        const formData = new FormData();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        formData.append('file', blob, 'cidades.csv');

        const importRes = await request('/admin/cidades/import', 'POST', formData, adminToken, true);
        console.log('   Status:', importRes.statusCode);
        console.log('   Body:', importRes.body);

        if (importRes.statusCode !== 200) throw new Error('Import failed');

        if (importRes.body.inseridos < 1) throw new Error('Import counts wrong');
        console.log('   Import success.');

        // 9. Instrumentos Check (just create one)
        console.log('9. Create Instrumento...');
        const instRes = await request('/admin/instrumentos', 'POST', { nome: 'Violino' }, adminToken);
        if (instRes.statusCode !== 201) throw new Error('Instrumento create failed');
        if (instRes.body.nome !== 'VIOLINO') throw new Error('Instrumento normalization failed');
        console.log('   Instrumento created.');

        console.log('\n--- ALL TESTS PASSED ---');

    } catch (e) {
        console.error('TEST FAILED:', e instanceof Error ? e.message : JSON.stringify(e));
        if (e.cause) console.error('Cause:', e.cause);
        process.exit(1);
    }
}

run();
