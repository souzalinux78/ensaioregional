
const http = require('http');

function request(path, method, body, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: 3333,
            path: path,
            method: method,
            headers: {
                ...(body ? { 'Content-Type': 'application/json', 'Content-Length': body.length } : {}),
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        };

        const req = http.request(options, (res) => {
            let responseBody = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => responseBody += chunk);
            res.on('end', () => {
                let parsed = responseBody;
                try { parsed = JSON.parse(responseBody); } catch (e) { }
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: parsed
                });
            });
        });

        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

function decodeJwt(token) {
    const payload = token.split('.')[1];
    const decoded = Buffer.from(payload, 'base64').toString();
    return JSON.parse(decoded);
}

async function run() {
    try {
        console.log('--- ADMIN MODULE TEST ---');

        // 1. Login Admin
        console.log('1. Login Admin...');
        const loginData = JSON.stringify({ email: 'admin@test.com', password: '123456' });
        const adminLogin = await request('/auth/login', 'POST', loginData);
        if (adminLogin.statusCode !== 200) throw new Error('Admin login failed');
        const adminToken = adminLogin.body.accessToken;
        const adminUser = decodeJwt(adminToken);
        console.log('   Admin ID:', adminUser.userId);

        // 2. Login User
        console.log('2. Login User...');
        const userLoginData = JSON.stringify({ email: 'user@test.com', password: '123456' });
        const userLogin = await request('/auth/login', 'POST', userLoginData);
        if (userLogin.statusCode !== 200) throw new Error('User login failed');
        const userToken = userLogin.body.accessToken;
        const regularUser = decodeJwt(userToken);
        console.log('   User ID:', regularUser.userId);

        // 3. Admin create Ensaio
        console.log('3. Admin create Ensaio...');
        const ensaioData = JSON.stringify({
            nome: 'Ensaio Setorial A',
            dataEvento: new Date().toISOString(),
            ativo: true
        });
        const createRes = await request('/admin/ensaios', 'POST', ensaioData, adminToken);
        console.log('   Status:', createRes.statusCode);
        if (createRes.statusCode !== 201) throw new Error('Create Ensaio failed: ' + JSON.stringify(createRes.body));
        const ensaioId = createRes.body.id;
        console.log('   Ensaio Created ID:', ensaioId);

        // 4. Admin List Ensaios
        console.log('4. Admin List Ensaios...');
        const listRes = await request('/admin/ensaios', 'GET', null, adminToken);
        if (listRes.statusCode !== 200) throw new Error('List failed');
        if (!Array.isArray(listRes.body)) throw new Error('List output not array');
        if (!listRes.body.find(e => e.id === ensaioId)) throw new Error('Created ensaio not in list');
        console.log('   Found created ensaio in list.');

        // 5. User try to access Admin route (List)
        console.log('5. User access Admin route (should fail)...');
        const userAccessRes = await request('/admin/ensaios', 'GET', null, userToken);
        console.log('   Status:', userAccessRes.statusCode);
        if (userAccessRes.statusCode !== 403) throw new Error('User was not forbidden! Status: ' + userAccessRes.statusCode);
        console.log('   User blocked as expected.');

        // 6. Admin Link User to Ensaio
        console.log('6. Admin Link User to Ensaio...');
        const linkData = JSON.stringify({ ensaioId: ensaioId });
        const linkRes = await request(`/admin/users/${regularUser.userId}/ensaio`, 'PATCH', linkData, adminToken);
        console.log('   Status:', linkRes.statusCode);
        if (linkRes.statusCode !== 200) throw new Error('Link failed: ' + JSON.stringify(linkRes.body));
        if (linkRes.body.ensaioRegionalId !== ensaioId) throw new Error('Link mismatch');
        console.log('   User linked successfully.');

        // 7. Admin Soft Delete Ensaio
        console.log('7. Admin Soft Delete Ensaio...');
        const delRes = await request(`/admin/ensaios/${ensaioId}`, 'DELETE', null, adminToken);
        console.log('   Status:', delRes.statusCode);
        if (delRes.statusCode !== 204) throw new Error('Delete failed. Status: ' + delRes.statusCode + ' Body: ' + JSON.stringify(delRes.body));

        // Verify delete from list
        const postDelList = await request('/admin/ensaios', 'GET', null, adminToken);
        const stillExists = postDelList.body.find(e => e.id === ensaioId);
        if (stillExists) throw new Error('Ensaio still listed after soft delete');
        console.log('   Ensaio removed from list (Soft Deleted).');

        console.log('\n--- ALL ADMIN TESTS PASSED ---');

    } catch (e) {
        console.error('TEST FAILED:', e.message);
        process.exit(1);
    }
}

run();
