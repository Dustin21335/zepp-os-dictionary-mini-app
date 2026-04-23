import { BaseSideService } from "@zeppos/zml/base-side";

async function getWordDefinition(word, res) {
  try {
    const response = await fetch({
      url: `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
      method: "GET",
    });
    res(null, {
      result: typeof response.body === "string" ? JSON.parse(response.body) : response.body,
    });
  } catch (error) {
    res(null, {
      result: "ERROR",
    });
  }
}

AppSideService(
  BaseSideService({
    onInit() {},
    onRequest(req, res) {
      if (req.method === "GetWordDefinition") {
        getWordDefinition(req.params?.word, res);
      }
    },
    onRun() {},
    onDestroy() {},
  })
);
