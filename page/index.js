import * as hmUI from "@zos/ui";
import { log } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { BasePage } from "@zeppos/zml/base-page";
import { setWakeUpRelaunch } from "@zos/display";

const deviceInfo = getDeviceInfo();
const logger = log.getLogger("dictionary");
let textWidget;
let wordWidget;
let pronunciationWidget;
let definitionWidget;

Page(
  BasePage({
    state: {},
    onInit(){
      setWakeUpRelaunch({relaunch: true});
    },
    build() {
      const openKeyboard = () => {
        hmUI.createKeyboard({
          inputType: hmUI.inputType.CHAR,
          text: textWidget?.getProperty(hmUI.prop.TEXT) || "",
          onComplete: (kb, result) => {
            textWidget.setProperty(hmUI.prop.TEXT, result?.data || "");
            hmUI.deleteKeyboard();
          },
        });
      };
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: px(10), 
        y: px(90),
        w: px(300),
        h: px(60),
        color: 0x333333,
        radius: px(12)
      }).addEventListener(hmUI.event.CLICK_DOWN, openKeyboard); 
      textWidget = hmUI.createWidget(hmUI.widget.TEXT, {
          x: px(20),  
          y: px(90),
          w: px(280),
          h: px(60),
          text_size: px(36),
          text: "",
          color: 0xFFFFFF,
      });
      textWidget.addEventListener(hmUI.event.CLICK_DOWN, openKeyboard);
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: (deviceInfo.width - px(70)), 
        y: px(90),
        w: px(60),
        h: px(60),
        text_size: px(36),
        radius: px(12),
        normal_color: 0x333333,
        press_color: 0x222222,
        text: "🔍"
      }).addEventListener(hmUI.event.CLICK_DOWN, async () =>{
        let word = textWidget.getProperty(hmUI.prop.TEXT);
        if (word && word != wordWidget.getProperty(hmUI.prop.TEXT)) {
          this.getWordDefinition();
        }
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
        y: px(200),
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
        h: px(2000),
        text_size: px(25),
        text: "",
        color: 0xFFFFFF,
        text_style: hmUI.text_style.WRAP,
      });
      hmUI.createWidget(hmUI.widget.PAGE_SCROLLBAR);
    },
    getWordDefinition() {
      this.request({
        method: "GetWordDefinition",
        params: {
          word: textWidget.getProperty(hmUI.prop.TEXT),
        },
      }).then((data) => {
          const result = data?.result;
          if (result?.title === "No Definitions Found" || !Array.isArray(result) || !result.length) {
            wordWidget.setProperty(hmUI.prop.TEXT, "No definition found");
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
      }).catch((error) => {
        logger.error("ERROR", error);
      });
    }
  })
);
