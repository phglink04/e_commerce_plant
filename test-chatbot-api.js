#!/usr/bin/env node

/**
 * Chatbot FE-BE Connection Test Script
 * Tests all chatbot API endpoints to verify frontend-backend connectivity
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TIMEOUT = 10000; // 10 seconds

const results = [];

async function fetch_with_timeout(url, options = {}, timeout = TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

async function test(name, testFn) {
    const startTime = Date.now();
    try {
        await testFn();
        const duration = Date.now() - startTime;
        results.push({ name, status: 'PASS', duration });
        console.log(`✅ ${name} (${duration}ms)`);
    } catch (error) {
        const duration = Date.now() - startTime;
        results.push({
            name,
            status: 'FAIL',
            duration,
            error: error instanceof Error ? error.message : String(error),
        });
        console.log(
            `❌ ${name} (${duration}ms)`,
            error instanceof Error ? error.message : error,
        );
    }
}

async function runTests() {
    console.log(`🧪 Chatbot API Connection Tests`);
    console.log(`📍 API Base URL: ${API_BASE_URL}`);
    console.log('─'.repeat(60));

    // Test 1: Status Check
    await test('1️⃣ Status Check', async () => {
        const response = await fetch_with_timeout(
            `${API_BASE_URL}/api/chatbot/status`,
        );
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        if (!data.status) throw new Error('No status field');
    });

    let chatId;

    // Test 2: Create Chat Session
    await test('2️⃣ Create Chat Session', async () => {
        const response = await fetch_with_timeout(
            `${API_BASE_URL}/api/chatbot/session/create`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName: 'Test User',
                    userId: '65beef0123456789abcdef01',
                }),
            },
        );
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        if (!data.data?.id) throw new Error('No chat ID in response');
        chatId = data.data.id;
    });

    // Test 3: Send Message
    let messageResponse;
    await test('3️⃣ Send Message to Chatbot', async () => {
        const response = await fetch_with_timeout(
            `${API_BASE_URL}/api/chatbot/message/send`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId,
                    message: 'Cây nào thích hợp cho phòng tối?',
                }),
            },
        );
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        if (!data.data?.message) throw new Error('No message in response');
        messageResponse = data.data;
    });

    // Test 4: Get Chat History
    await test('4️⃣ Get Chat History', async () => {
        const response = await fetch_with_timeout(
            `${API_BASE_URL}/api/chatbot/history/${chatId}`,
        );
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        if (!data.data?.messages) throw new Error('No messages in response');
        if (data.data.messages.length === 0)
            throw new Error('No messages in chat history');
    });

    // Test 5: Get User Chats
    await test('5️⃣ Get User Chat History', async () => {
        const response = await fetch_with_timeout(
            `${API_BASE_URL}/api/chatbot/user/65beef0123456789abcdef01`,
        );
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data.data)) throw new Error('Response is not an array');
    });

    // Test 6: Admin - Get Active Chats
    await test('6️⃣ Admin - Get Active Chats', async () => {
        const response = await fetch_with_timeout(
            `${API_BASE_URL}/api/chatbot/admin/active`,
        );
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data.data)) throw new Error('Response is not an array');
    });

    // Test 7: Admin - Get Pending Chats
    await test('7️⃣ Admin - Get Pending Chats', async () => {
        const response = await fetch_with_timeout(
            `${API_BASE_URL}/api/chatbot/admin/pending`,
        );
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data.data)) throw new Error('Response is not an array');
    });

    // Test 8: Admin - Get Stats
    await test('8️⃣ Admin - Get Chat Stats', async () => {
        const response = await fetch_with_timeout(
            `${API_BASE_URL}/api/chatbot/admin/stats`,
        );
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        if (!data.data?.totalChats)
            throw new Error('No stats in response');
    });

    // Test 9: Admin - Takeover Chat
    await test('9️⃣ Admin - Takeover Chat', async () => {
        const response = await fetch_with_timeout(
            `${API_BASE_URL}/api/chatbot/admin/takeover`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId,
                    message: 'Hello, I am here to help you!',
                }),
            },
        );
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        if (!data.data?.status) throw new Error('No chat data in response');
    });

    // Test 10: Admin - Close Chat
    await test('🔟 Admin - Close Chat', async () => {
        const response = await fetch_with_timeout(
            `${API_BASE_URL}/api/chatbot/admin/close`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId,
                    reason: 'Issue resolved',
                }),
            },
        );
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        if (!data.data?.isClosed) throw new Error('Chat not closed');
    });

    console.log('\n' + '─'.repeat(60));
    console.log('📊 Test Summary');
    console.log('─'.repeat(60));

    const passed = results.filter((r) => r.status === 'PASS').length;
    const failed = results.filter((r) => r.status === 'FAIL').length;
    const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`✅ Passed: ${passed}/${results.length}`);
    console.log(`❌ Failed: ${failed}/${results.length}`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);

    if (failed > 0) {
        console.log('\n❌ Failed Tests:');
        results
            .filter((r) => r.status === 'FAIL')
            .forEach((r) => {
                console.log(`  • ${r.name}: ${r.error}`);
            });
    }

    console.log('\n' + '─'.repeat(60));

    if (failed === 0) {
        console.log('🎉 All tests passed! FE-BE connection is working.');
    } else {
        console.log(`⚠️  ${failed} test(s) failed. Check the errors above.`);
    }
}

// Run tests
runTests().catch(console.error);
