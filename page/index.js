import * as hmUI from "@zos/ui";
import { log } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { BasePage } from "@zeppos/zml/base-page";
import { setWakeUpRelaunch } from "@zos/display";

const deviceInfo = getDeviceInfo();
const logger = log.getLogger("dictionary");
let inputWidget;
let statusWidget;
let wordWidget;
let pronunciationWidget;
let definitionWidget;

Page(
  BasePage({
    state: {},
    build() {
      const openKeyboard = () => {
        hmUI.createKeyboard({
          inputType: hmUI.inputType.CHAR,
          text: inputWidget?.getProperty(hmUI.prop.TEXT) || "",
          onComplete: (kb, result) => {
            inputWidget.setProperty(hmUI.prop.TEXT, result?.data || "");
            hmUI.deleteKeyboard();
          },
        });
      };
      const startSearch = async () => {
        let word = inputWidget.getProperty(hmUI.prop.TEXT);
        if (word && word != wordWidget.getProperty(hmUI.prop.TEXT)) {
            statusWidget.setProperty(hmUI.prop.TEXT, "");
            wordWidget.setProperty(hmUI.prop.TEXT, "Loading");
            pronunciationWidget.setProperty(hmUI.prop.TEXT, "");
            definitionWidget.setProperty(hmUI.prop.TEXT, "");
          this.getWordDefinition();
        }
      };
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: px(10), 
        y: px(90),
        w: px(300),
        h: px(60),
        color: 0x333333,
        radius: px(12)
      }).addEventListener(hmUI.event.CLICK_DOWN, openKeyboard); 
      inputWidget = hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(20),  
          y: px(90),
          w: px(280),
          h: px(60),
          text_size: px(36),
          text: "",
          color: 0xFFFFFF,
      });
      inputWidget.addEventListener(hmUI.event.CLICK_DOWN, openKeyboard);
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: (deviceInfo.width - px(70)), 
        y: px(90),
        w: px(60),
        h: px(60),
        color: 0x333333,
        radius: px(12)
      }).addEventListener(hmUI.event.CLICK_DOWN, startSearch); 
      hmUI.createWidget(hmUI.widget.IMG, {
        x: (deviceInfo.width - px(65)), 
        y: px(95),
        w: px(60),
        h: px(60),
        src: "searchicon.png"
      }).addEventListener(hmUI.event.CLICK_DOWN, startSearch);
      statusWidget = hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(20),
        y: px(160),
        w: deviceInfo.width - px(40),
        h: px(60),
        text_size: px(40),
        text: "",
        color: 0xFFFFFF,
        text_style: hmUI.text_style.WRAP,
      });
      wordWidget = hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(20),
        y: px(160),
        w: deviceInfo.width - px(40),
        h: px(60),
        text_size: px(40),
        text: "",
        color: 0xFFFFFF,
        text_style: hmUI.text_style.WRAP,
      });
      pronunciationWidget = hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(20),
        y: px(210),
        w: deviceInfo.width - px(40),
        h: px(60),
        text_size: px(20),
        text: "",
        color: 0xFFFFFF,
        text_style: hmUI.text_style.WRAP,
      });
      definitionWidget = hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(20),
        y: px(255),
        w: deviceInfo.width - px(40),
        h: px(60),
        text_size: px(25),
        text: "",
        color: 0xFFFFFF,
        text_style: hmUI.text_style.WRAP,
      });
      hmUI.createWidget(hmUI.widget.PAGE_SCROLLBAR);
    },
    getWordDefinition() {
      const word = inputWidget.getProperty(hmUI.prop.TEXT);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timed out")), 10000)
      );
      Promise.race([
        this.request({
          method: "GetWordDefinition",
          params: { word },
        }),
        timeoutPromise
      ]).then((data) => {
          const result = data?.result;
          if (result === "ERROR") {
            throw new Error("Request failed");
          }
          if (result?.title === "No Definitions Found" || !Array.isArray(result) || !result.length) {
            statusWidget.setProperty(hmUI.prop.TEXT, "No definition found");
            wordWidget.setProperty(hmUI.prop.TEXT, "");
            pronunciationWidget.setProperty(hmUI.prop.TEXT, "");
            definitionWidget.setProperty(hmUI.prop.TEXT, "");
            return;
          }
          const entry = result[0];
          let definitionsText = "";
          entry.meanings?.forEach((meaning, i) => {
            definitionsText += `${i + 1}. ${meaning.partOfSpeech}\n`;
            meaning.definitions?.forEach((def, j) => {
              definitionsText += `   - ${def.definition}\n`;
              if (def.example) {
                definitionsText += `     ${def.example}\n`;
              }
            });
            definitionsText += "\n";
          });
          wordWidget.setProperty(hmUI.prop.TEXT, entry.word);
          pronunciationWidget.setProperty(hmUI.prop.TEXT, entry.phonetic || entry.phonetics?.find((p) => p.text)?.text);
          definitionWidget.setProperty(hmUI.prop.TEXT, definitionsText);
          definitionWidget.setProperty(hmUI.prop.H, hmUI.getTextLayout(definitionsText, {
            text_size: px(25),
            text_width: deviceInfo.width - px(40),
            wrapped: 1
          }).height);
      }).catch((error) => {
          logger.error("ERROR", error);
          let message = `Error ${error?.message || ""}`;
          statusWidget.setProperty(hmUI.prop.TEXT, message);
          statusWidget.setProperty(hmUI.prop.H, hmUI.getTextLayout(message, {
            text_size: px(40),
            text_width: deviceInfo.width - px(40),
            wrapped: 1
          }).height);
          wordWidget.setProperty(hmUI.prop.TEXT, "");
          pronunciationWidget.setProperty(hmUI.prop.TEXT, "");
          definitionWidget.setProperty(hmUI.prop.TEXT, "");
          definitionWidget.setProperty(hmUI.prop.H, 60);
      });
    }
  })
);
