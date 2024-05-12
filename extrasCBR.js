// ==UserScript==
// @name         Extras UNIT3D CBR
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Modificações externas para o tracker capybarabr
// @match        capybarabr.com
// @grant        none
// @grant        GM_addStyle
// @icon         https://www.google.com/s2/favicons?sz=64&domain=unit3d.dev

// ==/UserScript==

(function() {
    'use strict';

    const chatboxID = '#chatbox__messages-create';
    const EMOJI_TRIGGER_HTML = `<div style="cursor: pointer; font-size: 24px;">😊</div>`;
    const EMOJI_PANEL_HTML = `<div style="position: absolute; display: flex; background: transparent; border: none;
                               padding: 5px; z-index: 10000; left: 35px; top: 0px; align-items: center;">
                              <span style="cursor: pointer;">😀</span> <span style="cursor: pointer;">🙁</span>
                              <span style="cursor: pointer;">😆</span> <span style="cursor: pointer;">😅</span>
                              <span style="cursor: pointer;">😂</span> <span style="cursor: pointer;">🤣</span>
                              <span style="cursor: pointer;">😍</span> <span style="cursor: pointer;">😝</span>
                              <span style="cursor: pointer;">😴</span> <span style="cursor: pointer;">🤮</span>
                              <span style="cursor: pointer;">🤦‍♂️</span> <span style="cursor: pointer;">❤️</span>
                              <span style="cursor: pointer;">🖤</span></div>`;
    const BBCODES_PANEL_HTML = `<div id="bbCodesPanel" style="position: absolute; display: flex; background: transparent; border: none;
                                padding: 5px; z-index: 9998; left: 35px; top: 0px; align-items: center;">
                                <span style="cursor: pointer; margin-right: 10px;" data-bbcode="[b][/b]">[B]</span>
                                <span style="cursor: pointer; margin-right: 10px;" data-bbcode="[i][/i]">[I]</span>
                                <span style="cursor: pointer; margin-right: 10px;" data-bbcode="[u][/u]">[U]</span>
                                <span style="cursor: pointer; margin-right: 10px;" data-bbcode="[url][/url]">[URL]</span>
                                <span style="cursor: pointer; margin-right: 10px;" data-bbcode="[img][/img]">[IMG]</span></div>`;

    function setupChatFeatures(chatbox) {
        const container = document.createElement('div');
        container.style.position = 'relative';
        container.style.display = 'inline-block';
        chatbox.parentNode.insertBefore(container, chatbox.nextSibling);

        const emojiTrigger = document.createElement('div');
        emojiTrigger.innerHTML = EMOJI_TRIGGER_HTML;
        container.appendChild(emojiTrigger);

        const emojiPanel = document.createElement('div');
        emojiPanel.innerHTML = EMOJI_PANEL_HTML;
        emojiPanel.style.display = 'none';
        container.appendChild(emojiPanel);

        const bbCodesPanel = document.createElement('div');
        bbCodesPanel.innerHTML = BBCODES_PANEL_HTML;
        container.appendChild(bbCodesPanel);

        emojiTrigger.addEventListener('click', function() {
            const isEmojiVisible = emojiPanel.style.display === 'none';
            emojiPanel.style.display = isEmojiVisible ? 'flex' : 'none';
            bbCodesPanel.style.display = isEmojiVisible ? 'none' : 'flex';
        });

        document.addEventListener('click', function(event) {
            if (!emojiPanel.contains(event.target) && !emojiTrigger.contains(event.target)) {
                emojiPanel.style.display = 'none';
                bbCodesPanel.style.display = 'flex';
            }
        });

        emojiPanel.querySelectorAll('span').forEach(function(span) {
            span.addEventListener('click', function() {
                const emoji = span.textContent;
                chatbox.value += emoji + ' ';
                chatbox.focus();
                emojiPanel.style.display = 'none';
            });
        });

        bbCodesPanel.querySelectorAll('span').forEach(function(span) {
            span.addEventListener('click', function() {
                const bbCode = span.getAttribute('data-bbcode');
                if (bbCode === "[img][/img]" || bbCode === "[url][/url]") {
                    autoCompleteAndPaste(bbCode, chatbox);
                } else {
                    insertBBCode(chatbox, bbCode);
                }
            });
        });
    }

    function autoCompleteAndPaste(tag, chatbox) {
        navigator.clipboard.readText().then(clipText => {
            let newContent = clipText.trim().length > 0 ?
                (tag.includes("[img]") ? `[img]${clipText}[/img]` : `[url=${clipText}]${clipText}[/url]`) :
            tag;
            chatbox.value += newContent;
            // Adjust cursor position to be between the tags
            if (clipText.trim().length > 0) {
                const pos = newContent.indexOf(']') + 1;
                chatbox.setSelectionRange(chatbox.value.length - pos, chatbox.value.length - pos);
            } else {
                const startPos = chatbox.value.length - (newContent.length - newContent.indexOf(']') - 1);
                const endPos = startPos + (newContent.lastIndexOf('[') - newContent.indexOf(']') - 1);
                chatbox.setSelectionRange(startPos, endPos);
            }
            chatbox.focus();
        }).catch(err => {
            console.error('Failed to read clipboard contents:', err);
            chatbox.value += tag;
            const startPos = chatbox.value.length - (tag.length - tag.indexOf(']') - 1);
            const endPos = startPos + (tag.lastIndexOf('[') - tag.indexOf(']') - 1);
            chatbox.setSelectionRange(startPos, endPos);
            chatbox.focus();
        });
}

    function insertBBCode(chatbox, bbCode) {
        const textSelected = chatbox.value.substring(chatbox.selectionStart, chatbox.selectionEnd);
        const startTag = bbCode.substring(0, bbCode.indexOf(']') + 1);
        const endTag = bbCode.substring(bbCode.lastIndexOf('['));
        if (textSelected.length > 0) {
            const newText = startTag + textSelected + endTag;
            chatbox.value = chatbox.value.substring(0, chatbox.selectionStart) + newText + chatbox.value.substring(chatbox.selectionEnd);
            const newPos = chatbox.selectionStart + newText.length - endTag.length;
            chatbox.setSelectionRange(newPos, newPos);
        } else {
            chatbox.value += startTag + endTag;
            const newPos = chatbox.value.length - endTag.length;
            chatbox.setSelectionRange(newPos, newPos);
        }
        chatbox.focus();
    }

    function checkAndSetup() {
        const chatbox = document.querySelector(chatboxID);
        if (chatbox) {
            setupChatFeatures(chatbox);
        } else {
            console.error('Chatbox not found: Ensure the chatbox ID is correct.');
            setTimeout(checkAndSetup, 100); // Check again in 100ms
        }
    }

    checkAndSetup(); // Start the setup process
})();

/*jshint esversion: 6 */
let enlargedPoster = document.createElement('div');
enlargedPoster.id = 'enlargedPoster';
enlargedPoster.className = 'enlarged-poster';
enlargedPoster.style.display = 'none';
document.body.appendChild(enlargedPoster);

function addListener() {
    let poster = document.querySelectorAll('.torrent-search--list__poster-img');
    if (poster == null) {
        setTimeout(function () { addListener() }, 100)
    }
    if (poster) {
        poster.forEach(p => {
            p.addEventListener('mousemove', function (event) {
                showEnlargedPoster(event, this, this.src);
            });
        });
    }
}

addListener();
function showEnlargedPoster(event, element, src) {
    const enlargedPoster = document.getElementById('enlargedPoster');
    if (src.includes("w92")) {
        src = src.replace("w92", "w500")
    }
    enlargedPoster.style.backgroundImage = `url('${src}')`;
    const x = event.clientX;
    const y = event.clientY;

    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    const viewportX = x + scrollX;
    const viewportY = y + scrollY;
    const offsetX = 10;
    let offsetY = -460;
    let space = viewportY - scrollY
    if (space <= 450 && space >= 200) {
        offsetY = -200;
    }else if(space <= 200){
        offsetY = 10
    }
    enlargedPoster.style.left = viewportX + offsetX + 'px'; // 10px to the right of the cursor
    enlargedPoster.style.top = viewportY + offsetY + 'px'; // 10px above the cursor

    enlargedPoster.style.display = 'block';

    element.addEventListener('mouseleave', function () {
        enlargedPoster.style.display = 'none';
    });
}

const posterStyler = `
    .enlarged-poster {
    position: absolute;
    width: 300px;
    height: 450px;
    background-size: cover;
    background-repeat: no-repeat;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    z-index: 9999;
}
`;

GM_addStyle(posterStyler)
