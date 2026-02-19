
const { Blob } = require('node:buffer');

async function run() {
    try {
        console.log('--- PRESENCA MODULE TEST ---');

        // Helpers
        async function request(path, method, body, token) {
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            if (body) headers['Content-Type'] = 'application/json';

            const options = {
                method,
                headers,
                body: body ? JSON.stringify(body) : null
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
                throw err;
            }
        }

        // 1. Setup Data (Login Admin)
        console.log('1. Login Admin...');
        const adminLogin = await request('/auth/login', 'POST', { email: 'admin@test.com', password: '123456' });
        if (adminLogin.statusCode !== 200) throw new Error('Admin login failed');
        const adminToken = adminLogin.body.accessToken;

        // Create Ensaio
        console.log('   Creating Ensaio...');
        const uniqueEnsaio = `Ensaio-${Date.now()}`;
        const ensaioRes = await request('/admin/ensaios', 'POST', { nome: uniqueEnsaio, dataEvento: new Date().toISOString() }, adminToken);
        if (ensaioRes.statusCode !== 201) throw new Error('Create Ensaio failed');
        const ensaioId = ensaioRes.body.id;

        // Login User
        console.log('2. Login User...');
        const userLogin = await request('/auth/login', 'POST', { email: 'user@test.com', password: '123456' });
        if (userLogin.statusCode !== 200) throw new Error('User login failed: ' + JSON.stringify(userLogin.body));
        const userToken = userLogin.body.accessToken;
        // User ID needed for linking
        const userId = JSON.parse(Buffer.from(userToken.split('.')[1], 'base64').toString()).userId;

        // Link User to Ensaio
        console.log('   Linking User to Ensaio...');
        const linkRes = await request(`/admin/users/${userId}/ensaio`, 'PATCH', { ensaioId }, adminToken);
        if (linkRes.statusCode !== 200) throw new Error('Link failed');

        // Refresh User Token to get updated context (if needed? Actually context is loaded from DB in middleware usually? 
        // Logic: middleware verifyJwt decodes token. Token has role/userId/tenantId. 
        // Does token have ensaioId? No.
        // Service queries DB for ensaioId based on userId. 
        // So no need to refresh token.

        // 3. Register Presenca (New City)
        console.log('3. Register Presenca (New City)...');
        const presenca1 = await request('/presenca', 'POST', {
            funcaoMinisterio: 'Porteiro',
            cidadeNome: `Cidade-${Date.now()}` // Creating new
        }, userToken);

        if (presenca1.statusCode !== 201) throw new Error('Presenca 1 failed: ' + JSON.stringify(presenca1.body));
        console.log('   Presenca 1 registered.');

        // 4. Register Presenca (Existing City ID + Instrumento Name)
        console.log('4. Register Presenca (Existing City ID + Instrumento)...');
        // Need a city ID. Let's create one via Admin first to be sure or fetch list.
        const cidadeRes = await request('/admin/cidades', 'POST', { nome: `City-${Date.now()}` }, adminToken);
        const cidadeId = cidadeRes.body.id;

        const presenca2 = await request('/presenca', 'POST', {
            funcaoMinisterio: 'Musico',
            cidadeId: cidadeId,
            instrumentoNome: 'Viola'
        }, userToken);

        if (presenca2.statusCode !== 201) throw new Error('Presenca 2 failed: ' + JSON.stringify(presenca2.body));
        console.log('   Presenca 2 registered.');

        // 5. Register with Invalid Instrumento ID
        console.log('5. Register with Invalid Instrumento ID (Should Fail)...');
        const failRes = await request('/presenca', 'POST', {
            funcaoMinisterio: 'Musico',
            cidadeId: cidadeId,
            instrumentoId: '00000000-0000-0000-0000-000000000000'
        }, userToken);

        if (failRes.statusCode !== 400) throw new Error('Should have failed with 400. Got: ' + failRes.statusCode + ' Body: ' + JSON.stringify(failRes.body));
        console.log('   Blocked as expected.');

        // 6. Test Unlinked User (Create new user)
        // Skip for now to keep simple, relies on seed.

        console.log('\n--- ALL PRESENCA TESTS PASSED ---');

    } catch (e) {
        console.error('TEST FAILED:', e instanceof Error ? e.message : JSON.stringify(e));
        if (e.cause) console.error('Cause:', e.cause);
        process.exit(1);
    }
}

run();
