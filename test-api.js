const handler = require('./src/api/generate-cards/route.js');

const testData = {
  topic: "Communicatie",
  targetAudience: "leraren",
  language: "Nederlands",
  specialNotes: "",
  numberOfQuestions: "5",
  contentType: "questions"
};

async function test() {
  const result = await handler.POST({
    json: async () => testData
  });
  console.log("Response:", result);
}

test().catch(console.error);
