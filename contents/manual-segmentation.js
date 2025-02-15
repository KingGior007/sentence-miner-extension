let lastSub;
const japanesePunctuation = /[！〜、。・：「」『』【】（）［］｛｝！＃＄％＆’（）＊＋，－．／：；＜＝＞＠［＼］＾＿｀｛｜｝～「」『』〆〤… 　 ？♪⸺]/g;

chrome.runtime.onMessage.addListener((message) => {
    let overlay = document.getElementsByClassName('custom-overlay')[0];
    if (!overlay) {
        return
    }
    const sentence = overlay.textContent;
    const beforeIndex = sentence.indexOf(message.word);
    const afterIndex = beforeIndex + message.word.length;
    const word = sentence.slice(beforeIndex, afterIndex)

    const beforeSegmentation = segment(sentence.slice(0, beforeIndex));
    const wordHtml = `<span class="segment-word" data-word="${word}">${word}</span>`
    const afterSegmenttation = segment(sentence.slice(afterIndex));

    overlay.innerHTML = beforeSegmentation + wordHtml + afterSegmenttation;

    document.querySelectorAll('.segment-word').forEach(span => {
        span.tabIndex = 0;
        span.addEventListener('focus', (e) => showPopup(e, lastSub));
        span.addEventListener('blur', hidePopup);
    });
});
