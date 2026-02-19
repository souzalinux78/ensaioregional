
const http = require('http');

const loginData = JSON.stringify({
    email: 'admin@test.com',
    password: '123456'
});

function request(path, method, data, cookie) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: 3333,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(data ? { 'Content-Length': data.length } : {}),
                ...(cookie ? { 'Cookie': cookie } : {})
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });

        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function run() {
    try {
        console.log('1. TEST LOGIN');
        const loginRes = await request('/auth/login', 'POST', loginData);
        console.log(`Login Status: ${loginRes.statusCode}`);
        if (loginRes.statusCode !== 200) throw new Error('Login failed');

        const cookies = loginRes.headers['set-cookie'];
        if (!cookies) throw new Error('No cookies set');
        console.log('Cookies:', cookies);

        const refreshTokenCookie = cookies.find(c => c.startsWith('refreshToken='));
        if (!refreshTokenCookie) throw new Error('Refresh token cookie missing');

        // Extract basic cookie part
        const cookieHeader = refreshTokenCookie.split(';')[0];
        console.log('Using cookie:', cookieHeader);

        console.log('\n2. TEST REFRESH');
        const refreshRes = await request('/auth/refresh', 'POST', '{}', cookieHeader);
        console.log(`Refresh Status: ${refreshRes.statusCode}`);
        if (refreshRes.statusCode !== 200) throw new Error('Refresh failed ' + refreshRes.body);

        const newCookies = refreshRes.headers['set-cookie'];
        if (!newCookies) throw new Error('No new cookies set');
        const newRefreshTokenCookie = newCookies.find(c => c.startsWith('refreshToken='));
        const newCookieHeader = newRefreshTokenCookie.split(';')[0];
        console.log('New Cookie:', newCookieHeader);

        if (cookieHeader === newCookieHeader) console.warn('WARNING: Token not rotated? (Might be same UUID if fast execution or logic flaw, check db)');
        else console.log('Token rotated successfully.');

        console.log('\n3. TEST LOGOUT');
        const logoutRes = await request('/auth/logout', 'POST', '{}', newCookieHeader);
        console.log(`Logout Status: ${logoutRes.statusCode}`);
        if (logoutRes.statusCode !== 200) throw new Error('Logout failed');

        console.log('\n4. TEST REFRESH AFTER LOGOUT (Should fail)');
        const failRes = await request('/auth/refresh', 'POST', '{}', newCookieHeader);
        console.log(`Fail Refresh Status: ${failRes.statusCode}`);
        if (failRes.statusCode !== 401) throw new Error('Refresh should have failed but got ' + failRes.statusCode);

        console.log('\nALL TESTS PASSED');

    } catch (e) {
        console.error('TEST FAILED:', e.message);
        process.exit(1);
    }
}

run();
