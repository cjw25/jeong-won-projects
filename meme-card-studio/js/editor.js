document.addEventListener(
    "DOMContentLoaded",
    () => {

        /* =================================================
           CONSTANTS
        ================================================= */

        const RATIOS = {
            "1:1": {
                width: 1080,
                height: 1080
            },

            "4:5": {
                width: 1080,
                height: 1350
            },

            "9:16": {
                width: 1080,
                height: 1920
            }
        };


        const DB_NAME =
            "memeCardStudioDB";

        const DB_VERSION =
            1;

        const STORE_NAME =
            "templates";

        const DRAFT_STORAGE_KEY =
            "memeCardStudioDraftV1";


        /* =================================================
           ELEMENTS
        ================================================= */

        const canvas =
            document.getElementById(
                "editorCanvas"
            );

        const ctx =
            canvas.getContext(
                "2d"
            );


        const imageInput =
            document.getElementById(
                "imageInput"
            );

        const uploadBox =
            document.querySelector(
                ".upload-box"
            );

        const fileMessage =
            document.getElementById(
                "fileMessage"
            );


        const imageScale =
            document.getElementById(
                "imageScale"
            );

        const imageScaleValue =
            document.getElementById(
                "imageScaleValue"
            );

        const imageX =
            document.getElementById(
                "imageX"
            );

        const imageXValue =
            document.getElementById(
                "imageXValue"
            );

        const imageY =
            document.getElementById(
                "imageY"
            );

        const imageYValue =
            document.getElementById(
                "imageYValue"
            );

        const backgroundColor =
            document.getElementById(
                "backgroundColor"
            );


        const textInput =
            document.getElementById(
                "textInput"
            );

        const fontSize =
            document.getElementById(
                "fontSize"
            );

        const fontSizeValue =
            document.getElementById(
                "fontSizeValue"
            );

        const textWidth =
            document.getElementById(
                "textWidth"
            );

        const textWidthValue =
            document.getElementById(
                "textWidthValue"
            );

        const textX =
            document.getElementById(
                "textX"
            );

        const textXValue =
            document.getElementById(
                "textXValue"
            );

        const textY =
            document.getElementById(
                "textY"
            );

        const textYValue =
            document.getElementById(
                "textYValue"
            );

        const textAlign =
            document.getElementById(
                "textAlign"
            );

        const fontWeight =
            document.getElementById(
                "fontWeight"
            );

        const textColor =
            document.getElementById(
                "textColor"
            );


        const ratioButtons =
            Array.from(
                document.querySelectorAll(
                    ".ratio-button"
                )
            );

        const outputSize =
            document.getElementById(
                "outputSize"
            );


        const resetEditorButton =
            document.getElementById(
                "resetEditorButton"
            );

        const downloadButton =
            document.getElementById(
                "downloadButton"
            );


        const templateName =
            document.getElementById(
                "templateName"
            );

        const saveTemplateButton =
            document.getElementById(
                "saveTemplateButton"
            );

        const updateTemplateButton =
            document.getElementById(
                "updateTemplateButton"
            );

        const deleteTemplateButton =
            document.getElementById(
                "deleteTemplateButton"
            );

        const templateList =
            document.getElementById(
                "templateList"
            );

        const templateCount =
            document.getElementById(
                "templateCount"
            );


        const exportJsonButton =
            document.getElementById(
                "exportJsonButton"
            );

        const importJsonInput =
            document.getElementById(
                "importJsonInput"
            );


        const statusBar =
            document.getElementById(
                "statusBar"
            );


        /* =================================================
           STATE
        ================================================= */

        const DEFAULT_STATE = {

            ratio:
                "1:1",

            backgroundColor:
                "#101827",

            imageDataUrl:
                null,

            imageElement:
                null,

            imageScale:
                1,

            imageX:
                0,

            imageY:
                0,

            text:
                "여기에 문구를 입력하세요",

            fontSize:
                72,

            textWidth:
                80,

            textX:
                50,

            textY:
                70,

            textColor:
                "#ffffff",

            textAlign:
                "center",

            fontWeight:
                700
        };


        let state = {
            ...DEFAULT_STATE
        };


        let selectedTemplateId =
            null;


        let renderPending =
            false;


        /* =================================================
           COMMON VALIDATION
        ================================================= */

        function isFiniteNumber(
            value
        ) {

            return (
                typeof value === "number" &&
                Number.isFinite(
                    value
                )
            );
        }


        function isHexColor(
            value
        ) {

            return (
                typeof value === "string" &&
                /^#[0-9a-f]{6}$/i.test(
                    value
                )
            );
        }


        function validNumber(
            value,
            min,
            max,
            fallback
        ) {

            const number =
                Number(
                    value
                );


            if (
                Number.isFinite(number) &&
                number >= min &&
                number <= max
            ) {

                return number;
            }


            return fallback;
        }


        /* =================================================
           T05 DRAFT AUTO SAVE
        ================================================= */

        function buildDraft() {

            return {

                ratio:
                    state.ratio,

                backgroundColor:
                    state.backgroundColor,

                imageScale:
                    state.imageScale,

                imageX:
                    state.imageX,

                imageY:
                    state.imageY,

                text:
                    state.text,

                fontSize:
                    state.fontSize,

                textWidth:
                    state.textWidth,

                textX:
                    state.textX,

                textY:
                    state.textY,

                textColor:
                    state.textColor,

                textAlign:
                    state.textAlign,

                fontWeight:
                    state.fontWeight
            };
        }


        function saveDraft() {

            try {

                localStorage.setItem(
                    DRAFT_STORAGE_KEY,
                    JSON.stringify(
                        buildDraft()
                    )
                );

            } catch (error) {

                console.warn(
                    "초안 자동저장 실패:",
                    error
                );
            }
        }


        function clearDraft() {

            try {

                localStorage.removeItem(
                    DRAFT_STORAGE_KEY
                );

            } catch (error) {

                console.warn(
                    "초안 삭제 실패:",
                    error
                );
            }
        }


        function restoreDraft() {

            let raw;


            try {

                raw =
                    localStorage.getItem(
                        DRAFT_STORAGE_KEY
                    );

            } catch (error) {

                return false;
            }


            if (
                raw === null
            ) {

                return false;
            }


            let draft;


            try {

                draft =
                    JSON.parse(
                        raw
                    );

            } catch (error) {

                clearDraft();

                return false;
            }


            if (
                !draft ||
                typeof draft !== "object" ||
                Array.isArray(draft)
            ) {

                clearDraft();

                return false;
            }


            const restored = {
                ...DEFAULT_STATE
            };


            if (
                RATIOS[
                    draft.ratio
                ]
            ) {

                restored.ratio =
                    draft.ratio;
            }


            if (
                isHexColor(
                    draft.backgroundColor
                )
            ) {

                restored.backgroundColor =
                    draft.backgroundColor;
            }


            restored.imageScale =
                validNumber(
                    draft.imageScale,
                    0.5,
                    2,
                    DEFAULT_STATE.imageScale
                );


            restored.imageX =
                validNumber(
                    draft.imageX,
                    -50,
                    50,
                    DEFAULT_STATE.imageX
                );


            restored.imageY =
                validNumber(
                    draft.imageY,
                    -50,
                    50,
                    DEFAULT_STATE.imageY
                );


            /*
             * 빈 문자열도 정상적인 편집 상태다.
             * T05-09를 위해 ""을 기본 문구로
             * 바꾸면 안 된다.
             */
            if (
                typeof draft.text === "string" &&
                draft.text.length <= 1000
            ) {

                restored.text =
                    draft.text;
            }


            restored.fontSize =
                validNumber(
                    draft.fontSize,
                    20,
                    180,
                    DEFAULT_STATE.fontSize
                );


            restored.textWidth =
                validNumber(
                    draft.textWidth,
                    20,
                    95,
                    DEFAULT_STATE.textWidth
                );


            restored.textX =
                validNumber(
                    draft.textX,
                    0,
                    100,
                    DEFAULT_STATE.textX
                );


            restored.textY =
                validNumber(
                    draft.textY,
                    0,
                    100,
                    DEFAULT_STATE.textY
                );


            if (
                isHexColor(
                    draft.textColor
                )
            ) {

                restored.textColor =
                    draft.textColor;
            }


            if (
                [
                    "left",
                    "center",
                    "right"
                ].includes(
                    draft.textAlign
                )
            ) {

                restored.textAlign =
                    draft.textAlign;
            }


            const restoredWeight =
                Number(
                    draft.fontWeight
                );


            if (
                [
                    400,
                    700,
                    900
                ].includes(
                    restoredWeight
                )
            ) {

                restored.fontWeight =
                    restoredWeight;
            }


            state =
                restored;


            return true;
        }


        /* =================================================
           STATUS
        ================================================= */

        function showStatus(
            message,
            type = ""
        ) {

            statusBar.textContent =
                message;

            statusBar.classList.remove(
                "error",
                "success"
            );


            if (
                type
            ) {

                statusBar.classList.add(
                    type
                );
            }
        }


        function showFileMessage(
            message,
            type = ""
        ) {

            fileMessage.textContent =
                message;

            fileMessage.classList.remove(
                "error",
                "success"
            );


            if (
                type
            ) {

                fileMessage.classList.add(
                    type
                );
            }
        }


        /* =================================================
           INDEXED DB
        ================================================= */

        function openDatabase() {

            return new Promise(
                (
                    resolve,
                    reject
                ) => {

                    const request =
                        indexedDB.open(
                            DB_NAME,
                            DB_VERSION
                        );


                    request.onupgradeneeded =
                        () => {

                            const db =
                                request.result;


                            if (
                                !db.objectStoreNames
                                    .contains(
                                        STORE_NAME
                                    )
                            ) {

                                db.createObjectStore(
                                    STORE_NAME,
                                    {
                                        keyPath:
                                            "id"
                                    }
                                );
                            }
                        };


                    request.onsuccess =
                        () => {

                            resolve(
                                request.result
                            );
                        };


                    request.onerror =
                        () => {

                            reject(
                                request.error
                            );
                        };
                }
            );
        }


        async function getAllTemplates() {

            const db =
                await openDatabase();


            return new Promise(
                (
                    resolve,
                    reject
                ) => {

                    const transaction =
                        db.transaction(
                            STORE_NAME,
                            "readonly"
                        );


                    const store =
                        transaction.objectStore(
                            STORE_NAME
                        );


                    const request =
                        store.getAll();


                    request.onsuccess =
                        () => {

                            const list =
                                request.result ||
                                [];


                            list.sort(
                                (
                                    a,
                                    b
                                ) =>
                                    b.updatedAt -
                                    a.updatedAt
                            );


                            resolve(
                                list
                            );
                        };


                    request.onerror =
                        () => {

                            reject(
                                request.error
                            );
                        };
                }
            );
        }


        async function saveTemplateToDb(
            template
        ) {

            const db =
                await openDatabase();


            return new Promise(
                (
                    resolve,
                    reject
                ) => {

                    const transaction =
                        db.transaction(
                            STORE_NAME,
                            "readwrite"
                        );


                    transaction
                        .objectStore(
                            STORE_NAME
                        )
                        .put(
                            template
                        );


                    transaction.oncomplete =
                        () => {

                            resolve();
                        };


                    transaction.onerror =
                        () => {

                            reject(
                                transaction.error
                            );
                        };
                }
            );
        }


        async function deleteTemplateFromDb(
            id
        ) {

            const db =
                await openDatabase();


            return new Promise(
                (
                    resolve,
                    reject
                ) => {

                    const transaction =
                        db.transaction(
                            STORE_NAME,
                            "readwrite"
                        );


                    transaction
                        .objectStore(
                            STORE_NAME
                        )
                        .delete(
                            id
                        );


                    transaction.oncomplete =
                        () => {

                            resolve();
                        };


                    transaction.onerror =
                        () => {

                            reject(
                                transaction.error
                            );
                        };
                }
            );
        }


        async function importTemplatesToDb(
            templates
        ) {

            const db =
                await openDatabase();


            return new Promise(
                (
                    resolve,
                    reject
                ) => {

                    const transaction =
                        db.transaction(
                            STORE_NAME,
                            "readwrite"
                        );


                    const store =
                        transaction.objectStore(
                            STORE_NAME
                        );


                    templates.forEach(
                        template => {

                            store.put(
                                template
                            );
                        }
                    );


                    transaction.oncomplete =
                        () => {

                            resolve();
                        };


                    transaction.onerror =
                        () => {

                            reject(
                                transaction.error
                            );
                        };
                }
            );
        }


        /* =================================================
           UUID
        ================================================= */

        function createId() {

            if (
                crypto.randomUUID
            ) {

                return crypto.randomUUID();
            }


            return (
                Date.now()
                    .toString(36) +
                "-" +
                Math.random()
                    .toString(36)
                    .slice(2)
            );
        }


        /* =================================================
           IMAGE VALIDATION
        ================================================= */

        async function detectImageType(
            file
        ) {

            const buffer =
                await file
                    .slice(
                        0,
                        12
                    )
                    .arrayBuffer();


            const bytes =
                new Uint8Array(
                    buffer
                );


            const isPng =
                bytes.length >= 8 &&
                bytes[0] === 0x89 &&
                bytes[1] === 0x50 &&
                bytes[2] === 0x4e &&
                bytes[3] === 0x47 &&
                bytes[4] === 0x0d &&
                bytes[5] === 0x0a &&
                bytes[6] === 0x1a &&
                bytes[7] === 0x0a;


            const isJpeg =
                bytes.length >= 3 &&
                bytes[0] === 0xff &&
                bytes[1] === 0xd8 &&
                bytes[2] === 0xff;


            if (
                isPng
            ) {

                return "png";
            }


            if (
                isJpeg
            ) {

                return "jpeg";
            }


            return null;
        }


        function loadImageFromUrl(
            url
        ) {

            return new Promise(
                (
                    resolve,
                    reject
                ) => {

                    const image =
                        new Image();


                    image.onload =
                        () => {

                            resolve(
                                image
                            );
                        };


                    image.onerror =
                        () => {

                            reject(
                                new Error(
                                    "이미지를 읽을 수 없습니다."
                                )
                            );
                        };


                    image.src =
                        url;
                }
            );
        }


        async function sanitizeImageFile(
            file
        ) {

            if (
                file.size >
                25 * 1024 * 1024
            ) {

                throw new Error(
                    "25MB 이하의 PNG 또는 JPEG 이미지를 사용해 주세요."
                );
            }


            const detectedType =
                await detectImageType(
                    file
                );


            if (
                detectedType !== "png" &&
                detectedType !== "jpeg"
            ) {

                throw new Error(
                    "지원하지 않는 파일입니다. PNG 또는 JPEG 이미지만 사용할 수 있습니다."
                );
            }


            const objectUrl =
                URL.createObjectURL(
                    file
                );


            try {

                const sourceImage =
                    await loadImageFromUrl(
                        objectUrl
                    );


                const maxDimension =
                    1920;


                const originalWidth =
                    sourceImage.naturalWidth;

                const originalHeight =
                    sourceImage.naturalHeight;


                if (
                    !originalWidth ||
                    !originalHeight
                ) {

                    throw new Error(
                        "이미지 크기를 확인할 수 없습니다."
                    );
                }


                const scale =
                    Math.min(
                        1,
                        maxDimension /
                        Math.max(
                            originalWidth,
                            originalHeight
                        )
                    );


                const cleanCanvas =
                    document.createElement(
                        "canvas"
                    );


                cleanCanvas.width =
                    Math.max(
                        1,
                        Math.round(
                            originalWidth *
                            scale
                        )
                    );


                cleanCanvas.height =
                    Math.max(
                        1,
                        Math.round(
                            originalHeight *
                            scale
                        )
                    );


                const cleanContext =
                    cleanCanvas.getContext(
                        "2d"
                    );


                cleanContext.clearRect(
                    0,
                    0,
                    cleanCanvas.width,
                    cleanCanvas.height
                );


                cleanContext.drawImage(
                    sourceImage,
                    0,
                    0,
                    cleanCanvas.width,
                    cleanCanvas.height
                );


                let dataUrl =
                    cleanCanvas.toDataURL(
                        "image/webp",
                        0.9
                    );


                if (
                    !dataUrl.startsWith(
                        "data:image/webp"
                    )
                ) {

                    dataUrl =
                        cleanCanvas.toDataURL(
                            "image/png"
                        );
                }


                const cleanImage =
                    await loadImageFromUrl(
                        dataUrl
                    );


                return {
                    dataUrl,
                    image:
                        cleanImage,
                    originalType:
                        detectedType
                };

            } finally {

                URL.revokeObjectURL(
                    objectUrl
                );
            }
        }


        async function applyImageFile(
            file
        ) {

            try {

                const result =
                    await sanitizeImageFile(
                        file
                    );


                state.imageDataUrl =
                    result.dataUrl;

                state.imageElement =
                    result.image;

                state.imageScale =
                    1;

                state.imageX =
                    0;

                state.imageY =
                    0;


                syncControlsFromState();

                scheduleRender();


                showFileMessage(
                    `${result.originalType.toUpperCase()} 이미지를 불러왔습니다. 원본 메타데이터는 제거되었습니다.`,
                    "success"
                );


                showStatus(
                    "이미지 불러오기 완료",
                    "success"
                );

            } catch (error) {

                showFileMessage(
                    error.message,
                    "error"
                );


                showStatus(
                    "이미지를 불러오지 않았습니다. 기존 작업은 유지됩니다.",
                    "error"
                );
            }


            imageInput.value =
                "";
        }


        /* =================================================
           TEXT WRAP
        ================================================= */

        function getCharacters(
            text
        ) {

            if (
                "Segmenter" in Intl
            ) {

                const segmenter =
                    new Intl.Segmenter(
                        "ko",
                        {
                            granularity:
                                "grapheme"
                        }
                    );


                return Array.from(
                    segmenter.segment(
                        text
                    ),
                    item =>
                        item.segment
                );
            }


            return Array.from(
                text
            );
        }


        function breakLongToken(
            token,
            maxWidth
        ) {

            const characters =
                getCharacters(
                    token
                );


            const lines =
                [];


            let current =
                "";


            characters.forEach(
                character => {

                    const candidate =
                        current +
                        character;


                    if (
                        current &&
                        ctx.measureText(
                            candidate
                        ).width >
                        maxWidth
                    ) {

                        lines.push(
                            current
                        );


                        current =
                            character;

                    } else {

                        current =
                            candidate;
                    }
                }
            );


            if (
                current
            ) {

                lines.push(
                    current
                );
            }


            return lines;
        }


        function wrapParagraph(
            paragraph,
            maxWidth
        ) {

            if (
                paragraph === ""
            ) {

                return [""];
            }


            const words =
                paragraph.split(
                    /\s+/
                );


            const result =
                [];


            let line =
                "";


            words.forEach(
                word => {

                    if (
                        ctx.measureText(
                            word
                        ).width >
                        maxWidth
                    ) {

                        if (
                            line
                        ) {

                            result.push(
                                line
                            );

                            line =
                                "";
                        }


                        const pieces =
                            breakLongToken(
                                word,
                                maxWidth
                            );


                        pieces.forEach(
                            (
                                piece,
                                index
                            ) => {

                                if (
                                    index ===
                                    pieces.length - 1
                                ) {

                                    line =
                                        piece;

                                } else {

                                    result.push(
                                        piece
                                    );
                                }
                            }
                        );


                        return;
                    }


                    const candidate =
                        line
                            ? `${line} ${word}`
                            : word;


                    if (
                        line &&
                        ctx.measureText(
                            candidate
                        ).width >
                        maxWidth
                    ) {

                        result.push(
                            line
                        );


                        line =
                            word;

                    } else {

                        line =
                            candidate;
                    }
                }
            );


            if (
                line
            ) {

                result.push(
                    line
                );
            }


            return result;
        }


        function buildWrappedLines(
            text,
            maxWidth
        ) {

            const paragraphs =
                text.split(
                    "\n"
                );


            const lines =
                [];


            paragraphs.forEach(
                paragraph => {

                    lines.push(
                        ...wrapParagraph(
                            paragraph,
                            maxWidth
                        )
                    );
                }
            );


            return lines;
        }


        /* =================================================
           CANVAS RENDER
        ================================================= */

        function renderCanvas() {

            const size =
                RATIOS[
                    state.ratio
                ];


            if (
                canvas.width !==
                size.width
            ) {

                canvas.width =
                    size.width;
            }


            if (
                canvas.height !==
                size.height
            ) {

                canvas.height =
                    size.height;
            }


            outputSize.textContent =
                `${size.width} × ${size.height}`;


            ctx.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );


            ctx.fillStyle =
                state.backgroundColor;


            ctx.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );


            if (
                state.imageElement
            ) {

                const image =
                    state.imageElement;


                const coverScale =
                    Math.max(
                        canvas.width /
                        image.naturalWidth,

                        canvas.height /
                        image.naturalHeight
                    );


                const finalScale =
                    coverScale *
                    state.imageScale;


                const drawWidth =
                    image.naturalWidth *
                    finalScale;


                const drawHeight =
                    image.naturalHeight *
                    finalScale;


                const offsetX =
                    (
                        state.imageX /
                        100
                    ) *
                    canvas.width;


                const offsetY =
                    (
                        state.imageY /
                        100
                    ) *
                    canvas.height;


                const drawX =
                    (
                        canvas.width -
                        drawWidth
                    ) /
                    2 +
                    offsetX;


                const drawY =
                    (
                        canvas.height -
                        drawHeight
                    ) /
                    2 +
                    offsetY;


                ctx.drawImage(
                    image,
                    drawX,
                    drawY,
                    drawWidth,
                    drawHeight
                );
            }


            const fontSizePx =
                state.fontSize;


            ctx.font =
                `${state.fontWeight} ${fontSizePx}px "Malgun Gothic", "Apple SD Gothic Neo", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;


            ctx.fillStyle =
                state.textColor;


            ctx.textBaseline =
                "top";


            const maxTextWidth =
                (
                    state.textWidth /
                    100
                ) *
                canvas.width;


            const requestedCenterX =
                (
                    state.textX /
                    100
                ) *
                canvas.width;


            const boxLeft =
                Math.max(
                    0,

                    Math.min(
                        canvas.width -
                        maxTextWidth,

                        requestedCenterX -
                        maxTextWidth /
                        2
                    )
                );


            let anchorX;


            if (
                state.textAlign ===
                "left"
            ) {

                ctx.textAlign =
                    "left";

                anchorX =
                    boxLeft;

            } else if (
                state.textAlign ===
                "right"
            ) {

                ctx.textAlign =
                    "right";

                anchorX =
                    boxLeft +
                    maxTextWidth;

            } else {

                ctx.textAlign =
                    "center";

                anchorX =
                    boxLeft +
                    maxTextWidth /
                    2;
            }


            const lines =
                buildWrappedLines(
                    state.text,
                    maxTextWidth
                );


            const lineHeight =
                fontSizePx *
                1.22;


            const startY =
                (
                    state.textY /
                    100
                ) *
                canvas.height;


            lines.forEach(
                (
                    line,
                    index
                ) => {

                    ctx.fillText(
                        line,
                        anchorX,
                        startY +
                        index *
                        lineHeight
                    );
                }
            );
        }


        function scheduleRender() {

            /*
             * 편집 이벤트마다 현재 상태를 저장한다.
             */
            saveDraft();


            if (
                renderPending
            ) {

                return;
            }


            renderPending =
                true;


            requestAnimationFrame(
                () => {

                    renderPending =
                        false;

                    renderCanvas();
                }
            );
        }


        /* =================================================
           CONTROL SYNC
        ================================================= */

        function syncControlsFromState() {

            imageScale.value =
                Math.round(
                    state.imageScale *
                    100
                );


            imageScaleValue.value =
                `${imageScale.value}%`;


            imageX.value =
                state.imageX;

            imageXValue.value =
                state.imageX;


            imageY.value =
                state.imageY;

            imageYValue.value =
                state.imageY;


            backgroundColor.value =
                state.backgroundColor;


            textInput.value =
                state.text;


            fontSize.value =
                state.fontSize;

            fontSizeValue.value =
                `${state.fontSize}px`;


            textWidth.value =
                state.textWidth;

            textWidthValue.value =
                `${state.textWidth}%`;


            textX.value =
                state.textX;

            textXValue.value =
                `${state.textX}%`;


            textY.value =
                state.textY;

            textYValue.value =
                `${state.textY}%`;


            textColor.value =
                state.textColor;


            textAlign.value =
                state.textAlign;


            fontWeight.value =
                String(
                    state.fontWeight
                );


            ratioButtons.forEach(
                button => {

                    const active =
                        button.dataset.ratio ===
                        state.ratio;


                    button.classList.toggle(
                        "active",
                        active
                    );


                    button.setAttribute(
                        "aria-pressed",
                        String(
                            active
                        )
                    );
                }
            );
        }


        /* =================================================
           FORM EVENTS
        ================================================= */

        imageScale.addEventListener(
            "input",
            () => {

                state.imageScale =
                    Number(
                        imageScale.value
                    ) /
                    100;


                imageScaleValue.value =
                    `${imageScale.value}%`;


                scheduleRender();
            }
        );


        imageX.addEventListener(
            "input",
            () => {

                state.imageX =
                    Number(
                        imageX.value
                    );


                imageXValue.value =
                    imageX.value;


                scheduleRender();
            }
        );


        imageY.addEventListener(
            "input",
            () => {

                state.imageY =
                    Number(
                        imageY.value
                    );


                imageYValue.value =
                    imageY.value;


                scheduleRender();
            }
        );


        backgroundColor.addEventListener(
            "input",
            () => {

                state.backgroundColor =
                    backgroundColor.value;


                scheduleRender();
            }
        );


        textInput.addEventListener(
            "input",
            () => {

                state.text =
                    textInput.value;


                scheduleRender();
            }
        );


        fontSize.addEventListener(
            "input",
            () => {

                state.fontSize =
                    Number(
                        fontSize.value
                    );


                fontSizeValue.value =
                    `${fontSize.value}px`;


                scheduleRender();
            }
        );


        textWidth.addEventListener(
            "input",
            () => {

                state.textWidth =
                    Number(
                        textWidth.value
                    );


                textWidthValue.value =
                    `${textWidth.value}%`;


                scheduleRender();
            }
        );


        textX.addEventListener(
            "input",
            () => {

                state.textX =
                    Number(
                        textX.value
                    );


                textXValue.value =
                    `${textX.value}%`;


                scheduleRender();
            }
        );


        textY.addEventListener(
            "input",
            () => {

                state.textY =
                    Number(
                        textY.value
                    );


                textYValue.value =
                    `${textY.value}%`;


                scheduleRender();
            }
        );


        textColor.addEventListener(
            "input",
            () => {

                state.textColor =
                    textColor.value;


                scheduleRender();
            }
        );


        textAlign.addEventListener(
            "change",
            () => {

                state.textAlign =
                    textAlign.value;


                scheduleRender();
            }
        );


        fontWeight.addEventListener(
            "change",
            () => {

                state.fontWeight =
                    Number(
                        fontWeight.value
                    );


                scheduleRender();
            }
        );


        /* =================================================
           RATIO
        ================================================= */

        ratioButtons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        state.ratio =
                            button.dataset.ratio;


                        syncControlsFromState();

                        scheduleRender();


                        showStatus(
                            `${state.ratio} 화면비로 변경했습니다.`,
                            "success"
                        );
                    }
                );
            }
        );


        /* =================================================
           FILE INPUT
        ================================================= */

        imageInput.addEventListener(
            "change",
            () => {

                const file =
                    imageInput.files?.[0];


                if (
                    file
                ) {

                    applyImageFile(
                        file
                    );
                }
            }
        );


        [
            "dragenter",
            "dragover"
        ].forEach(
            eventName => {

                uploadBox.addEventListener(
                    eventName,
                    event => {

                        event.preventDefault();


                        uploadBox.classList.add(
                            "dragging"
                        );
                    }
                );
            }
        );


        [
            "dragleave",
            "drop"
        ].forEach(
            eventName => {

                uploadBox.addEventListener(
                    eventName,
                    event => {

                        event.preventDefault();


                        uploadBox.classList.remove(
                            "dragging"
                        );
                    }
                );
            }
        );


        uploadBox.addEventListener(
            "drop",
            event => {

                const file =
                    event.dataTransfer
                        ?.files?.[0];


                if (
                    file
                ) {

                    applyImageFile(
                        file
                    );
                }
            }
        );


        /* =================================================
           DOWNLOAD
        ================================================= */

        downloadButton.addEventListener(
            "click",
            () => {

                renderCanvas();


                canvas.toBlob(
                    blob => {

                        if (
                            !blob
                        ) {

                            showStatus(
                                "PNG 파일을 만들지 못했습니다.",
                                "error"
                            );

                            return;
                        }


                        const url =
                            URL.createObjectURL(
                                blob
                            );


                        const link =
                            document.createElement(
                                "a"
                            );


                        const cleanName =
                            (
                                templateName.value.trim() ||
                                "meme-card"
                            )
                            .replace(
                                /[\\/:*?"<>|]+/g,
                                "-"
                            );


                        link.href =
                            url;


                        link.download =
                            `${cleanName}-${state.ratio.replace(
                                ":",
                                "x"
                            )}.png`;


                        document.body
                            .appendChild(
                                link
                            );


                        link.click();

                        link.remove();


                        setTimeout(
                            () => {

                                URL.revokeObjectURL(
                                    url
                                );
                            },
                            1000
                        );


                        showStatus(
                            "현재 미리보기와 같은 PNG 파일을 만들었습니다.",
                            "success"
                        );

                    },
                    "image/png"
                );
            }
        );


        /* =================================================
           RESET EDITOR
        ================================================= */

        resetEditorButton.addEventListener(
            "click",
            () => {

                const confirmed =
                    window.confirm(
                        "현재 편집 내용을 새 작업으로 초기화할까요?"
                    );


                if (
                    !confirmed
                ) {

                    return;
                }


                /*
                 * 새 작업:
                 * 기존 초안을 완전히 제거한다.
                 */
                clearDraft();


                state = {
                    ...DEFAULT_STATE
                };


                selectedTemplateId =
                    null;


                templateName.value =
                    "";


                updateTemplateButton.disabled =
                    true;


                deleteTemplateButton.disabled =
                    true;


                syncControlsFromState();

                /*
                 * 여기서는 scheduleRender()를 호출하지 않는다.
                 * scheduleRender()는 다시 초안을 저장하기 때문이다.
                 */
                renderCanvas();


                renderTemplateList();


                showStatus(
                    "새 작업으로 초기화했습니다.",
                    "success"
                );
            }
        );


        /* =================================================
           TEMPLATE SERIALIZE
        ================================================= */

        function buildTemplate(
            name,
            id
        ) {

            const now =
                Date.now();


            return {

                id,

                name,

                ratio:
                    state.ratio,

                backgroundColor:
                    state.backgroundColor,

                imageDataUrl:
                    state.imageDataUrl,

                imageScale:
                    state.imageScale,

                imageX:
                    state.imageX,

                imageY:
                    state.imageY,

                text:
                    state.text,

                fontSize:
                    state.fontSize,

                textWidth:
                    state.textWidth,

                textX:
                    state.textX,

                textY:
                    state.textY,

                textColor:
                    state.textColor,

                textAlign:
                    state.textAlign,

                fontWeight:
                    state.fontWeight,

                updatedAt:
                    now
            };
        }


        /* =================================================
           TEMPLATE VALIDATION
        ================================================= */

        function validateTemplate(
            template
        ) {

            if (
                !template ||
                typeof template !==
                    "object"
            ) {

                return false;
            }


            if (
                typeof template.id !==
                    "string" ||
                !template.id
            ) {

                return false;
            }


            if (
                typeof template.name !==
                    "string" ||
                !template.name.trim() ||
                template.name.length > 60
            ) {

                return false;
            }


            if (
                !RATIOS[
                    template.ratio
                ]
            ) {

                return false;
            }


            if (
                !isHexColor(
                    template.backgroundColor
                ) ||
                !isHexColor(
                    template.textColor
                )
            ) {

                return false;
            }


            if (
                template.imageDataUrl !==
                    null &&
                (
                    typeof template.imageDataUrl !==
                        "string" ||

                    !template.imageDataUrl
                        .startsWith(
                            "data:image/"
                        )
                )
            ) {

                return false;
            }


            const numericChecks = [

                [
                    template.imageScale,
                    0.5,
                    2
                ],

                [
                    template.imageX,
                    -50,
                    50
                ],

                [
                    template.imageY,
                    -50,
                    50
                ],

                [
                    template.fontSize,
                    20,
                    180
                ],

                [
                    template.textWidth,
                    20,
                    95
                ],

                [
                    template.textX,
                    0,
                    100
                ],

                [
                    template.textY,
                    0,
                    100
                ],

                [
                    template.fontWeight,
                    400,
                    900
                ],

                [
                    template.updatedAt,
                    0,
                    Number.MAX_SAFE_INTEGER
                ]
            ];


            for (
                const [
                    value,
                    min,
                    max
                ]
                of numericChecks
            ) {

                if (
                    !isFiniteNumber(
                        value
                    ) ||
                    value < min ||
                    value > max
                ) {

                    return false;
                }
            }


            if (
                typeof template.text !==
                    "string" ||
                template.text.length >
                    1000
            ) {

                return false;
            }


            if (
                ![
                    "left",
                    "center",
                    "right"
                ].includes(
                    template.textAlign
                )
            ) {

                return false;
            }


            if (
                ![
                    400,
                    700,
                    900
                ].includes(
                    template.fontWeight
                )
            ) {

                return false;
            }


            return true;
        }


        /* =================================================
           SAVE NEW TEMPLATE
        ================================================= */

        saveTemplateButton.addEventListener(
            "click",
            async () => {

                const name =
                    templateName.value
                        .trim();


                if (
                    !name
                ) {

                    showStatus(
                        "템플릿 이름을 입력해 주세요.",
                        "error"
                    );


                    templateName.focus();

                    return;
                }


                try {

                    const id =
                        createId();


                    const template =
                        buildTemplate(
                            name,
                            id
                        );


                    await saveTemplateToDb(
                        template
                    );


                    selectedTemplateId =
                        id;


                    await renderTemplateList();


                    updateTemplateButton.disabled =
                        false;


                    deleteTemplateButton.disabled =
                        false;


                    showStatus(
                        `"${name}" 템플릿을 저장했습니다.`,
                        "success"
                    );

                } catch (error) {

                    showStatus(
                        "템플릿 저장 중 오류가 발생했습니다.",
                        "error"
                    );
                }
            }
        );


        /* =================================================
           APPLY TEMPLATE
        ================================================= */

        async function applyTemplate(
            template
        ) {

            let image =
                null;


            if (
                template.imageDataUrl
            ) {

                try {

                    image =
                        await loadImageFromUrl(
                            template.imageDataUrl
                        );

                } catch (error) {

                    showStatus(
                        "템플릿의 이미지 데이터를 읽을 수 없어 기존 작업을 유지합니다.",
                        "error"
                    );

                    return;
                }
            }


            state = {

                ratio:
                    template.ratio,

                backgroundColor:
                    template.backgroundColor,

                imageDataUrl:
                    template.imageDataUrl,

                imageElement:
                    image,

                imageScale:
                    template.imageScale,

                imageX:
                    template.imageX,

                imageY:
                    template.imageY,

                text:
                    template.text,

                fontSize:
                    template.fontSize,

                textWidth:
                    template.textWidth,

                textX:
                    template.textX,

                textY:
                    template.textY,

                textColor:
                    template.textColor,

                textAlign:
                    template.textAlign,

                fontWeight:
                    template.fontWeight
            };


            selectedTemplateId =
                template.id;


            templateName.value =
                template.name;


            updateTemplateButton.disabled =
                false;


            deleteTemplateButton.disabled =
                false;


            syncControlsFromState();

            scheduleRender();


            await renderTemplateList();


            showStatus(
                `"${template.name}" 템플릿을 불러왔습니다.`,
                "success"
            );
        }


        /* =================================================
           UPDATE TEMPLATE
        ================================================= */

        updateTemplateButton.addEventListener(
            "click",
            async () => {

                if (
                    !selectedTemplateId
                ) {

                    return;
                }


                const name =
                    templateName.value
                        .trim();


                if (
                    !name
                ) {

                    showStatus(
                        "템플릿 이름을 입력해 주세요.",
                        "error"
                    );

                    return;
                }


                try {

                    const template =
                        buildTemplate(
                            name,
                            selectedTemplateId
                        );


                    await saveTemplateToDb(
                        template
                    );


                    await renderTemplateList();


                    showStatus(
                        `"${name}" 템플릿을 수정했습니다.`,
                        "success"
                    );

                } catch (error) {

                    showStatus(
                        "템플릿 수정 중 오류가 발생했습니다.",
                        "error"
                    );
                }
            }
        );


        /* =================================================
           DELETE TEMPLATE
        ================================================= */

        deleteTemplateButton.addEventListener(
            "click",
            async () => {

                if (
                    !selectedTemplateId
                ) {

                    return;
                }


                const confirmed =
                    window.confirm(
                        "선택한 템플릿을 삭제할까요?"
                    );


                if (
                    !confirmed
                ) {

                    return;
                }


                try {

                    await deleteTemplateFromDb(
                        selectedTemplateId
                    );


                    selectedTemplateId =
                        null;


                    updateTemplateButton.disabled =
                        true;


                    deleteTemplateButton.disabled =
                        true;


                    templateName.value =
                        "";


                    await renderTemplateList();


                    showStatus(
                        "템플릿을 삭제했습니다.",
                        "success"
                    );

                } catch (error) {

                    showStatus(
                        "템플릿 삭제 중 오류가 발생했습니다.",
                        "error"
                    );
                }
            }
        );


        /* =================================================
           TEMPLATE LIST
        ================================================= */

        async function renderTemplateList() {

            try {

                const templates =
                    await getAllTemplates();


                templateCount.textContent =
                    `${templates.length}개`;


                templateList.innerHTML =
                    "";


                if (
                    templates.length === 0
                ) {

                    templateList.innerHTML =
                        `
                        <p class="empty-template">
                            아직 저장된 템플릿이 없습니다.
                        </p>
                        `;

                    return;
                }


                templates.forEach(
                    template => {

                        const button =
                            document.createElement(
                                "button"
                            );


                        button.type =
                            "button";


                        button.className =
                            "template-card";


                        if (
                            template.id ===
                            selectedTemplateId
                        ) {

                            button.classList.add(
                                "selected"
                            );
                        }


                        const safeName =
                            document.createElement(
                                "strong"
                            );


                        safeName.textContent =
                            template.name;


                        const info =
                            document.createElement(
                                "span"
                            );


                        info.textContent =
                            `${template.ratio} · ${
                                new Date(
                                    template.updatedAt
                                ).toLocaleString()
                            }`;


                        button.append(
                            safeName,
                            info
                        );


                        button.addEventListener(
                            "click",
                            () => {

                                applyTemplate(
                                    template
                                );
                            }
                        );


                        templateList.appendChild(
                            button
                        );
                    }
                );

            } catch (error) {

                showStatus(
                    "저장된 템플릿을 불러오지 못했습니다.",
                    "error"
                );
            }
        }


        /* =================================================
           JSON EXPORT
        ================================================= */

        exportJsonButton.addEventListener(
            "click",
            async () => {

                try {

                    const templates =
                        await getAllTemplates();


                    const payload = {

                        app:
                            "meme-card-studio",

                        version:
                            1,

                        exportedAt:
                            new Date()
                                .toISOString(),

                        templates
                    };


                    const blob =
                        new Blob(
                            [
                                JSON.stringify(
                                    payload,
                                    null,
                                    2
                                )
                            ],
                            {
                                type:
                                    "application/json"
                            }
                        );


                    const url =
                        URL.createObjectURL(
                            blob
                        );


                    const link =
                        document.createElement(
                            "a"
                        );


                    link.href =
                        url;


                    link.download =
                        "meme-card-studio-templates.json";


                    document.body
                        .appendChild(
                            link
                        );


                    link.click();

                    link.remove();


                    setTimeout(
                        () => {

                            URL.revokeObjectURL(
                                url
                            );
                        },
                        1000
                    );


                    showStatus(
                        `${templates.length}개 템플릿을 JSON으로 내보냈습니다.`,
                        "success"
                    );

                } catch (error) {

                    showStatus(
                        "JSON 내보내기에 실패했습니다.",
                        "error"
                    );
                }
            }
        );


        /* =================================================
           JSON IMPORT VALIDATION
        ================================================= */

        async function validateImportPayload(
            payload
        ) {

            if (
                !payload ||
                typeof payload !==
                    "object"
            ) {

                throw new Error(
                    "JSON 최상위 형식이 올바르지 않습니다."
                );
            }


            if (
                payload.app !==
                    "meme-card-studio" ||
                payload.version !==
                    1 ||
                !Array.isArray(
                    payload.templates
                )
            ) {

                throw new Error(
                    "필수 항목(app, version, templates)이 없습니다."
                );
            }


            for (
                const template
                of payload.templates
            ) {

                if (
                    !validateTemplate(
                        template
                    )
                ) {

                    throw new Error(
                        "필수 항목이 누락되었거나 잘못된 템플릿이 포함되어 있습니다."
                    );
                }


                if (
                    template.imageDataUrl
                ) {

                    try {

                        await loadImageFromUrl(
                            template.imageDataUrl
                        );

                    } catch (error) {

                        throw new Error(
                            "읽을 수 없는 이미지가 포함된 템플릿이 있습니다."
                        );
                    }
                }
            }


            return payload.templates;
        }


        /* =================================================
           JSON IMPORT
        ================================================= */

        importJsonInput.addEventListener(
            "change",
            async () => {

                const file =
                    importJsonInput
                        .files?.[0];


                importJsonInput.value =
                    "";


                if (
                    !file
                ) {

                    return;
                }


                try {

                    const text =
                        await file.text();


                    let payload;


                    try {

                        payload =
                            JSON.parse(
                                text
                            );

                    } catch (error) {

                        throw new Error(
                            "JSON 문법이 손상되어 가져오기를 취소했습니다."
                        );
                    }


                    const templates =
                        await validateImportPayload(
                            payload
                        );


                    await importTemplatesToDb(
                        templates
                    );


                    await renderTemplateList();


                    showStatus(
                        `${templates.length}개 템플릿을 복원했습니다.`,
                        "success"
                    );

                } catch (error) {

                    showStatus(
                        `${error.message} 기존 템플릿은 유지됩니다.`,
                        "error"
                    );
                }
            }
        );


        /* =================================================
           INITIALIZE
        ================================================= */

        async function initialize() {

            const restored =
                restoreDraft();


            syncControlsFromState();

            renderCanvas();


            await renderTemplateList();


            if (
                restored
            ) {

                showStatus(
                    "마지막 편집 초안을 복구했습니다.",
                    "success"
                );

            } else {

                showStatus(
                    "준비되었습니다. PNG 또는 JPEG 이미지를 불러와 편집해 보세요."
                );
            }
        }


        initialize();

    }
);