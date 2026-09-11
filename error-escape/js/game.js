document.addEventListener(
    "DOMContentLoaded",
    () => {

        /* =================================================
           CONFIG
        ================================================= */

        const CONFIG = {

            maxHp: 3,

            laneCount: 5,

            /*
             * 과제의 난이도 비교에서는
             * 이 값 하나만 변경한다.
             *
             * A : 1.00
             * B : 1.15
             */
            speedMultiplier: 1.00
        };


        const STAGES = [

            {
                number: 1,

                name: "CODING",

                duration: 7,

                speed: 0.31,

                spawnInterval: 0.80,

                fixChance: 0.11,

                coffeeChance: 0
            },

            {
                number: 2,

                name: "TEST",

                duration: 8,

                speed: 0.37,

                spawnInterval: 0.66,

                fixChance: 0.16,

                coffeeChance: 0
            },

            {
                number: 3,

                name: "DEPLOY",

                duration: 9,

                speed: 0.44,

                spawnInterval: 0.54,

                fixChance: 0.14,

                coffeeChance: 0.06
            }

        ];


        const DANGERS = [
            "ERROR",
            "BUG",
            "404",
            "500"
        ];


        const SAVE_KEY =
            "errorEscapeSaveV3";


        /* =================================================
           ELEMENTS
        ================================================= */

        const gameArea =
            document.getElementById(
                "gameArea"
            );


        const player =
            document.getElementById(
                "player"
            );


        const gameState =
            document.getElementById(
                "gameState"
            );


        const stageDisplay =
            document.getElementById(
                "stageDisplay"
            );


        const timeDisplay =
            document.getElementById(
                "timeDisplay"
            );


        const scoreDisplay =
            document.getElementById(
                "scoreDisplay"
            );


        const bestDisplay =
            document.getElementById(
                "bestDisplay"
            );


        const healthDisplay =
            document.getElementById(
                "healthDisplay"
            );


        const comboDisplay =
            document.getElementById(
                "comboDisplay"
            );


        const startOverlay =
            document.getElementById(
                "startOverlay"
            );


        const countdownOverlay =
            document.getElementById(
                "countdownOverlay"
            );


        const countdownText =
            document.getElementById(
                "countdownText"
            );


        const pauseOverlay =
            document.getElementById(
                "pauseOverlay"
            );


        const stageClearOverlay =
            document.getElementById(
                "stageClearOverlay"
            );


        const stageClearTitle =
            document.getElementById(
                "stageClearTitle"
            );


        const stageClearMessage =
            document.getElementById(
                "stageClearMessage"
            );


        const stageClearScore =
            document.getElementById(
                "stageClearScore"
            );


        const stageClearHp =
            document.getElementById(
                "stageClearHp"
            );


        const nextStageInfo =
            document.getElementById(
                "nextStageInfo"
            );


        const gameOverOverlay =
            document.getElementById(
                "gameOverOverlay"
            );


        const gameOverMessage =
            document.getElementById(
                "gameOverMessage"
            );


        const gameOverScore =
            document.getElementById(
                "gameOverScore"
            );


        const gameOverStage =
            document.getElementById(
                "gameOverStage"
            );


        const finalOverlay =
            document.getElementById(
                "finalOverlay"
            );


        const finalScore =
            document.getElementById(
                "finalScore"
            );


        const finalBest =
            document.getElementById(
                "finalBest"
            );


        const finalCombo =
            document.getElementById(
                "finalCombo"
            );


        const stageBanner =
            document.getElementById(
                "stageBanner"
            );


        const stageNumber =
            document.getElementById(
                "stageNumber"
            );


        const stageName =
            document.getElementById(
                "stageName"
            );


        const eventMessage =
            document.getElementById(
                "eventMessage"
            );


        const statusMessage =
            document.getElementById(
                "statusMessage"
            );


        const startButton =
            document.getElementById(
                "startButton"
            );


        const nextStageButton =
            document.getElementById(
                "nextStageButton"
            );


        const retryStageButton =
            document.getElementById(
                "retryStageButton"
            );


        const restartAllButton =
            document.getElementById(
                "restartAllButton"
            );


        const finalRestartButton =
            document.getElementById(
                "finalRestartButton"
            );


        const pauseButton =
            document.getElementById(
                "pauseButton"
            );


        const resumeButton =
            document.getElementById(
                "resumeButton"
            );


        const leftButton =
            document.getElementById(
                "leftButton"
            );


        const rightButton =
            document.getElementById(
                "rightButton"
            );


        const motionButton =
            document.getElementById(
                "motionButton"
            );


        const resetSaveButton =
            document.getElementById(
                "resetSaveButton"
            );


        /* =================================================
           SAVE
        ================================================= */

        function getDefaultSave() {

            return {

                bestScore: 0,

                reduceMotion:
                    window.matchMedia(
                        "(prefers-reduced-motion: reduce)"
                    ).matches
            };
        }


        function savePersistentData() {

            try {

                localStorage.setItem(
                    SAVE_KEY,
                    JSON.stringify(
                        persistent
                    )
                );

            } catch (error) {

                console.warn(
                    "브라우저 저장 기능을 사용할 수 없습니다."
                );
            }
        }


        function loadPersistentData() {

            const defaults =
                getDefaultSave();


            try {

                const raw =
                    localStorage.getItem(
                        SAVE_KEY
                    );


                /*
                 * 빈 저장값
                 */
                if (
                    raw === null ||
                    raw.trim() === ""
                ) {

                    return defaults;
                }


                const parsed =
                    JSON.parse(
                        raw
                    );


                if (
                    parsed === null ||
                    typeof parsed !==
                        "object"
                ) {

                    throw new Error(
                        "저장 형식 오류"
                    );
                }


                if (
                    typeof parsed.bestScore
                        !== "number" ||

                    !Number.isFinite(
                        parsed.bestScore
                    ) ||

                    parsed.bestScore < 0
                ) {

                    throw new Error(
                        "최고 점수 오류"
                    );
                }


                if (
                    typeof parsed.reduceMotion
                        !== "boolean"
                ) {

                    throw new Error(
                        "움직임 설정 오류"
                    );
                }


                return {

                    bestScore:
                        Math.floor(
                            parsed.bestScore
                        ),

                    reduceMotion:
                        parsed.reduceMotion
                };

            } catch (error) {

                /*
                 * 손상값이면 기본값 복구
                 */

                try {

                    localStorage.setItem(
                        SAVE_KEY,
                        JSON.stringify(
                            defaults
                        )
                    );

                } catch (
                    storageError
                ) {
                    // 저장 불가 환경에서도
                    // 게임은 계속 실행
                }


                return defaults;
            }
        }


        let persistent =
            loadPersistentData();


        /* =================================================
           STATE
        ================================================= */

        let state =
            "READY";


        let pausedFrom =
            null;


        let currentStageIndex =
            0;


        let playerLane =
            2;


        let hp =
            CONFIG.maxHp;


        let score =
            0;


        let scoreAtStageStart =
            0;


        let stageElapsed =
            0;


        let combo =
            0;


        let maxCombo =
            0;


        let shield =
            false;


        let nextSpawnTime =
            0;


        let items =
            [];


        let countdown =
            2;


        let lastTimestamp =
            null;


        let stageBannerTimer =
            null;


        let eventTimer =
            null;


        /* =================================================
           HELPERS
        ================================================= */

        function getCurrentStage() {

            return STAGES[
                currentStageIndex
            ];
        }


        function setState(
            newState
        ) {

            state =
                newState;


            const labels = {

                READY:
                    "READY",

                COUNTDOWN:
                    "COUNTDOWN",

                PLAYING:
                    "PLAYING",

                PAUSED:
                    "PAUSED",

                STAGE_CLEAR:
                    "STAGE CLEAR",

                GAME_OVER:
                    "GAME OVER",

                ALL_CLEAR:
                    "ALL CLEAR"
            };


            gameState.textContent =
                labels[
                    newState
                ] || newState;
        }


        function announce(
            message
        ) {

            statusMessage.textContent =
                "";


            requestAnimationFrame(
                () => {

                    statusMessage.textContent =
                        message;
                }
            );
        }


        /* =================================================
           HUD
        ================================================= */

        function updateHUD() {

            const stage =
                getCurrentStage();


            const remaining =
                Math.max(
                    0,

                    stage.duration -
                    stageElapsed
                );


            stageDisplay.textContent =
                `${stage.number} / ${STAGES.length}`;


            timeDisplay.textContent =
                remaining.toFixed(
                    1
                );


            scoreDisplay.textContent =
                Math.floor(
                    score
                );


            bestDisplay.textContent =
                persistent.bestScore;


            healthDisplay.textContent =
                hp > 0
                    ? Array(hp)
                        .fill("♥")
                        .join(" ")
                    : "0";


            comboDisplay.textContent =
                `x${combo}`;


            player.classList.toggle(
                "shielded",
                shield
            );
        }


        /* =================================================
           PLAYER
        ================================================= */

        function updatePlayerPosition() {

            player.style.setProperty(
                "--lane",
                playerLane
            );
        }


        function movePlayer(
            direction
        ) {

            if (
                state !==
                "PLAYING"
            ) {

                return;
            }


            const nextLane =
                playerLane +
                direction;


            playerLane =
                Math.max(
                    0,

                    Math.min(
                        CONFIG.laneCount - 1,
                        nextLane
                    )
                );


            updatePlayerPosition();
        }


        /* =================================================
           ITEMS
        ================================================= */

        function clearItems() {

            for (
                const item
                of items
            ) {

                if (
                    item.element
                        .isConnected
                ) {

                    item.element
                        .remove();
                }
            }


            items =
                [];
        }


        function randomLane() {

            return Math.floor(
                Math.random() *
                CONFIG.laneCount
            );
        }


        function createItem(
            kind,
            text,
            lane,
            speed
        ) {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                `falling-item ${kind}`;


            element.textContent =
                text;


            element.style.setProperty(
                "--lane",
                lane
            );


            gameArea.appendChild(
                element
            );


            items.push({

                kind,

                text,

                lane,

                y: -0.12,

                speed,

                element,

                resolved: false
            });
        }


        function spawnItem() {

            const stage =
                getCurrentStage();


            const roll =
                Math.random();


            const speed =
                stage.speed *
                CONFIG.speedMultiplier;


            /*
             * COFFEE
             */

            if (
                roll <
                stage.coffeeChance
            ) {

                createItem(
                    "coffee",
                    "COFFEE",
                    randomLane(),
                    speed
                );

                return;
            }


            /*
             * FIX
             */

            if (
                roll <
                stage.coffeeChance +
                stage.fixChance
            ) {

                createItem(
                    "fix",
                    "FIX +",
                    randomLane(),
                    speed
                );

                return;
            }


            /*
             * 장애물
             */

            const danger =
                DANGERS[
                    Math.floor(
                        Math.random() *
                        DANGERS.length
                    )
                ];


            createItem(
                "danger",
                danger,
                randomLane(),
                speed
            );
        }


        /* =================================================
           EFFECT
        ================================================= */

        function showEvent(
            text,
            isDanger = false
        ) {

            if (
                eventTimer
            ) {

                clearTimeout(
                    eventTimer
                );
            }


            eventMessage.textContent =
                text;


            eventMessage
                .classList
                .toggle(
                    "danger-message",
                    isDanger
                );


            eventTimer =
                setTimeout(
                    () => {

                        eventMessage.textContent =
                            "";
                    },

                    430
                );
        }


        function playCollisionEffect() {

            if (
                persistent.reduceMotion
            ) {

                return;
            }


            gameArea
                .classList
                .remove(
                    "shake"
                );


            /*
             * 같은 효과 다시 시작
             */
            void gameArea.offsetWidth;


            gameArea
                .classList
                .add(
                    "shake"
                );
        }


        /* =================================================
           COLLISION
        ================================================= */

        function resolveItem(
            item
        ) {

            if (
                item.resolved ||
                state !==
                    "PLAYING"
            ) {

                return;
            }


            item.resolved =
                true;


            /*
             * FIX
             */

            if (
                item.kind ===
                "fix"
            ) {

                combo++;


                maxCombo =
                    Math.max(
                        maxCombo,
                        combo
                    );


                const multiplier =
                    combo >= 3
                        ? 2
                        : 1;


                const gained =
                    100 *
                    multiplier;


                score +=
                    gained;


                showEvent(
                    combo >= 3
                        ? `COMBO x2 +${gained}`
                        : `FIX +${gained}`
                );


                announce(
                    `FIX 획득. ${gained}점`
                );
            }


            /*
             * COFFEE
             */

            if (
                item.kind ===
                "coffee"
            ) {

                shield =
                    true;


                showEvent(
                    "SHIELD READY"
                );


                announce(
                    "보호막을 획득했습니다."
                );
            }


            /*
             * 장애물
             */

            if (
                item.kind ===
                "danger"
            ) {

                combo =
                    0;


                if (
                    shield
                ) {

                    shield =
                        false;


                    showEvent(
                        "BLOCK!"
                    );


                    announce(
                        "보호막이 오류를 막았습니다."
                    );

                } else {

                    hp--;


                    playCollisionEffect();


                    showEvent(
                        "CRASH!",
                        true
                    );


                    announce(
                        `오류 충돌. 남은 체력 ${hp}`
                    );


                    if (
                        hp <= 0
                    ) {

                        finishFailure();
                    }
                }
            }


            if (
                item.element
                    .isConnected
            ) {

                item.element
                    .remove();
            }


            updateHUD();
        }


        function updateItems(
            delta
        ) {

            for (
                const item
                of items
            ) {

                if (
                    item.resolved ||
                    !item.element
                        .isConnected
                ) {

                    continue;
                }


                item.y +=
                    item.speed *
                    delta;


                item.element.style.top =
                    `${item.y * 100}%`;


                /*
                 * 플레이어 충돌 영역
                 */

                const collisionZone =
                    item.y >= 0.77 &&
                    item.y <= 0.94;


                if (
                    collisionZone &&
                    item.lane ===
                        playerLane
                ) {

                    resolveItem(
                        item
                    );

                    continue;
                }


                /*
                 * 화면 아래로 나감
                 */

                if (
                    item.y > 1.08
                ) {

                    item.resolved =
                        true;


                    item.element
                        .remove();
                }
            }


            items =
                items.filter(
                    item =>
                        !item.resolved &&
                        item.element
                            .isConnected
                );
        }


        /* =================================================
           STAGE BANNER
        ================================================= */

        function showStageBanner() {

            const stage =
                getCurrentStage();


            if (
                stageBannerTimer
            ) {

                clearTimeout(
                    stageBannerTimer
                );
            }


            stageNumber.textContent =
                `STAGE ${stage.number}`;


            stageName.textContent =
                stage.name;


            stageBanner.hidden =
                false;


            stageBannerTimer =
                setTimeout(
                    () => {

                        stageBanner.hidden =
                            true;
                    },

                    900
                );
        }


        /* =================================================
           STAGE RESET
        ================================================= */

        function resetStageState(
            restoreScore
        ) {

            clearItems();


            if (
                restoreScore
            ) {

                score =
                    scoreAtStageStart;
            }


            hp =
                CONFIG.maxHp;


            playerLane =
                2;


            stageElapsed =
                0;


            combo =
                0;


            shield =
                false;


            nextSpawnTime =
                0;


            lastTimestamp =
                null;


            updatePlayerPosition();

            updateHUD();
        }


        /* =================================================
           START STAGE
        ================================================= */

        function beginStage() {

            stageClearOverlay.hidden =
                true;


            gameOverOverlay.hidden =
                true;


            pauseOverlay.hidden =
                true;


            scoreAtStageStart =
                score;


            resetStageState(
                false
            );


            setState(
                "PLAYING"
            );


            showStageBanner();


            announce(
                `스테이지 ${getCurrentStage().number} ${getCurrentStage().name} 시작`
            );
        }


        /* =================================================
           STAGE CLEAR
        ================================================= */

        function finishStage() {

            if (
                state !==
                "PLAYING"
            ) {

                return;
            }


            clearItems();


            /*
             * 마지막 스테이지
             */

            if (
                currentStageIndex ===
                STAGES.length - 1
            ) {

                finishAll();

                return;
            }


            setState(
                "STAGE_CLEAR"
            );


            const stage =
                getCurrentStage();


            stageClearTitle.textContent =
                `${stage.name} CLEAR!`;


            stageClearMessage.textContent =
                `STAGE ${stage.number}을 완료했습니다.`;


            stageClearScore.textContent =
                Math.floor(
                    score
                );


            stageClearHp.textContent =
                Array(hp)
                    .fill("♥")
                    .join(" ");


            const nextStage =
                STAGES[
                    currentStageIndex + 1
                ];


            nextStageInfo.textContent =
                `NEXT : STAGE ${nextStage.number} — ${nextStage.name}`;


            stageClearOverlay.hidden =
                false;


            nextStageButton.focus();


            announce(
                `스테이지 ${stage.number} 클리어`
            );
        }


        function goNextStage() {

            if (
                state !==
                "STAGE_CLEAR"
            ) {

                return;
            }


            currentStageIndex++;


            beginStage();
        }


        /* =================================================
           FAILURE
        ================================================= */

        function updateBestScore() {

            const current =
                Math.floor(
                    score
                );


            if (
                current >
                persistent.bestScore
            ) {

                persistent.bestScore =
                    current;


                savePersistentData();
            }
        }


        function finishFailure() {

            if (
                state !==
                "PLAYING"
            ) {

                return;
            }


            clearItems();


            setState(
                "GAME_OVER"
            );


            updateBestScore();


            const stage =
                getCurrentStage();


            gameOverMessage.textContent =
                `${stage.name} 단계에서 시스템이 중단되었습니다.`;


            gameOverScore.textContent =
                Math.floor(
                    score
                );


            gameOverStage.textContent =
                `${stage.number} / ${STAGES.length}`;


            gameOverOverlay.hidden =
                false;


            updateHUD();


            retryStageButton.focus();


            announce(
                "게임 실패"
            );
        }


        function retryCurrentStage() {

            if (
                state !==
                "GAME_OVER"
            ) {

                return;
            }


            /*
             * 실패 직전 얻었던 점수를
             * 반복해서 쌓지 못하게 복원
             */

            score =
                scoreAtStageStart;


            beginStage();
        }


        /* =================================================
           ALL CLEAR
        ================================================= */

        function finishAll() {

            clearItems();


            setState(
                "ALL_CLEAR"
            );


            /*
             * 전체 클리어 보너스
             */

            score +=
                500;


            updateBestScore();


            finalScore.textContent =
                Math.floor(
                    score
                );


            finalBest.textContent =
                persistent.bestScore;


            finalCombo.textContent =
                `x${maxCombo}`;


            finalOverlay.hidden =
                false;


            updateHUD();


            finalRestartButton.focus();


            announce(
                "모든 스테이지 클리어. 배포 성공."
            );
        }


        /* =================================================
           WHOLE GAME RESET
        ================================================= */

        function resetWholeGame() {

            clearItems();


            currentStageIndex =
                0;


            playerLane =
                2;


            hp =
                CONFIG.maxHp;


            score =
                0;


            scoreAtStageStart =
                0;


            stageElapsed =
                0;


            combo =
                0;


            maxCombo =
                0;


            shield =
                false;


            nextSpawnTime =
                0;


            lastTimestamp =
                null;


            updatePlayerPosition();

            updateHUD();
        }


        /* =================================================
           START GAME
        ================================================= */

        function startGame() {

            resetWholeGame();


            startOverlay.hidden =
                true;


            stageClearOverlay.hidden =
                true;


            gameOverOverlay.hidden =
                true;


            finalOverlay.hidden =
                true;


            pauseOverlay.hidden =
                true;


            countdown =
                2;


            countdownText.textContent =
                "2";


            countdownOverlay.hidden =
                false;


            setState(
                "COUNTDOWN"
            );


            announce(
                "2초 후 게임을 시작합니다."
            );
        }


        /* =================================================
           PAUSE
        ================================================= */

        function pauseGame() {

            if (
                state !==
                    "PLAYING" &&
                state !==
                    "COUNTDOWN"
            ) {

                return;
            }


            pausedFrom =
                state;


            setState(
                "PAUSED"
            );


            pauseOverlay.hidden =
                false;


            announce(
                "게임 일시정지"
            );
        }


        function resumeGame() {

            if (
                state !==
                "PAUSED"
            ) {

                return;
            }


            pauseOverlay.hidden =
                true;


            setState(
                pausedFrom ||
                "PLAYING"
            );


            lastTimestamp =
                null;


            announce(
                "게임 재개"
            );
        }


        function togglePause() {

            if (
                state ===
                "PAUSED"
            ) {

                resumeGame();

            } else {

                pauseGame();
            }
        }


        /* =================================================
           MOTION
        ================================================= */

        function applyMotionSetting() {

            document.body
                .classList
                .toggle(
                    "reduce-motion",
                    persistent.reduceMotion
                );


            motionButton.textContent =
                persistent.reduceMotion
                    ? "움직임 줄이기: ON"
                    : "움직임 줄이기: OFF";


            motionButton.setAttribute(
                "aria-pressed",
                String(
                    persistent.reduceMotion
                )
            );


            /*
             * 켜는 즉시 현재 흔들림 제거
             */

            if (
                persistent.reduceMotion
            ) {

                gameArea
                    .classList
                    .remove(
                        "shake"
                    );
            }
        }


        function toggleMotion() {

            persistent.reduceMotion =
                !persistent.reduceMotion;


            savePersistentData();

            applyMotionSetting();


            announce(
                persistent.reduceMotion
                    ? "움직임 감소 켜짐"
                    : "움직임 감소 꺼짐"
            );
        }


        /* =================================================
           SAVE RESET
        ================================================= */

        function resetSave() {

            const confirmed =
                window.confirm(
                    "최고 점수와 효과 설정을 초기화할까요?"
                );


            if (
                !confirmed
            ) {

                return;
            }


            persistent =
                getDefaultSave();


            savePersistentData();

            applyMotionSetting();

            updateHUD();


            announce(
                "저장 기록이 초기화되었습니다."
            );
        }


        /* =================================================
           BUTTON EVENTS
        ================================================= */

        startButton.addEventListener(
            "click",
            startGame
        );


        nextStageButton.addEventListener(
            "click",
            goNextStage
        );


        retryStageButton.addEventListener(
            "click",
            retryCurrentStage
        );


        restartAllButton.addEventListener(
            "click",
            startGame
        );


        finalRestartButton.addEventListener(
            "click",
            startGame
        );


        pauseButton.addEventListener(
            "click",
            togglePause
        );


        resumeButton.addEventListener(
            "click",
            resumeGame
        );


        leftButton.addEventListener(
            "click",
            () => {

                movePlayer(
                    -1
                );
            }
        );


        rightButton.addEventListener(
            "click",
            () => {

                movePlayer(
                    1
                );
            }
        );


        motionButton.addEventListener(
            "click",
            toggleMotion
        );


        resetSaveButton.addEventListener(
            "click",
            resetSave
        );


        /* =================================================
           KEYBOARD
        ================================================= */

        document.addEventListener(
            "keydown",
            event => {

                /*
                 * 키를 누르고 있을 때
                 * 자동 반복 입력 방지
                 */

                if (
                    event.repeat
                ) {

                    return;
                }


                const key =
                    event.key
                        .toLowerCase();


                /*
                 * LEFT
                 */

                if (
                    key ===
                        "arrowleft" ||
                    key ===
                        "a"
                ) {

                    event.preventDefault();


                    movePlayer(
                        -1
                    );
                }


                /*
                 * RIGHT
                 */

                if (
                    key ===
                        "arrowright" ||
                    key ===
                        "d"
                ) {

                    event.preventDefault();


                    movePlayer(
                        1
                    );
                }


                /*
                 * PAUSE
                 */

                if (
                    key ===
                    "p"
                ) {

                    event.preventDefault();


                    togglePause();
                }


                /*
                 * SPACE
                 */

                if (
                    event.code ===
                    "Space"
                ) {

                    event.preventDefault();


                    if (
                        state ===
                            "READY" ||
                        state ===
                            "ALL_CLEAR"
                    ) {

                        startGame();
                    }
                }
            }
        );


        /* =================================================
           FOCUS / TAB OUT
        ================================================= */

        function autoPause() {

            if (
                state ===
                    "PLAYING" ||
                state ===
                    "COUNTDOWN"
            ) {

                pauseGame();
            }
        }


        window.addEventListener(
            "blur",
            autoPause
        );


        document.addEventListener(
            "visibilitychange",
            () => {

                if (
                    document.hidden
                ) {

                    autoPause();
                }
            }
        );


        /* =================================================
           MAIN LOOP
        ================================================= */

        function gameLoop(
            timestamp
        ) {

            /*
             * 첫 프레임
             */

            if (
                lastTimestamp ===
                null
            ) {

                lastTimestamp =
                    timestamp;
            }


            let delta =
                (
                    timestamp -
                    lastTimestamp
                ) / 1000;


            lastTimestamp =
                timestamp;


            /*
             * 브라우저 복귀 시
             * 시간이 한꺼번에 흐르는 것 방지
             */

            delta =
                Math.min(
                    delta,
                    0.05
                );


            /* =============================================
               COUNTDOWN
            ============================================== */

            if (
                state ===
                "COUNTDOWN"
            ) {

                countdown -=
                    delta;


                if (
                    countdown > 0
                ) {

                    countdownText.textContent =
                        Math.ceil(
                            countdown
                        );

                } else {

                    countdownOverlay.hidden =
                        true;


                    beginStage();
                }
            }


            /* =============================================
               PLAYING
            ============================================== */

            if (
                state ===
                "PLAYING"
            ) {

                const stage =
                    getCurrentStage();


                stageElapsed +=
                    delta;


                /*
                 * 생존 점수
                 */

                score +=
                    delta *
                    10;


                /*
                 * 장애물 생성
                 */

                if (
                    stageElapsed >=
                    nextSpawnTime
                ) {

                    spawnItem();


                    nextSpawnTime =
                        stageElapsed +
                        stage.spawnInterval;
                }


                /*
                 * 장애물 이동
                 */

                updateItems(
                    delta
                );


                /*
                 * updateItems에서
                 * 사망했을 수도 있으므로
                 * 상태를 다시 검사
                 */

                if (
                    state ===
                        "PLAYING" &&
                    stageElapsed >=
                        stage.duration
                ) {

                    stageElapsed =
                        stage.duration;


                    finishStage();
                }


                if (
                    state ===
                    "PLAYING"
                ) {

                    updateHUD();
                }
            }


            requestAnimationFrame(
                gameLoop
            );
        }


        /* =================================================
           INIT
        ================================================= */

        applyMotionSetting();


        resetWholeGame();


        setState(
            "READY"
        );


        requestAnimationFrame(
            gameLoop
        );

    }
);