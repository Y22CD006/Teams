async function run() {
  try {
    console.log("Connecting to SSE...");
    const res = await fetch('http://localhost:3000/api/stream', {
      headers: {
        'Cookie': 'mock_userId=cmrbpdfit0000v5qg700cpnwc', // User 2
        'Accept': 'text/event-stream'
      }
    });
    console.log("Status:", res.status);
    console.log("Headers:", res.headers);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log("DATA:", decoder.decode(value));
    }
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
