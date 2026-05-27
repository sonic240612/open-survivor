/**
 * practice.js - 엔지니어링 캡슐화 실습 모듈
 * 
 * 선생님의 지침에 따라 모든 로직을 클래스 단위로 설계하고,
 * 데이터 접근을 엄격히 제어하는 캡슐화 방식을 실습합니다.
 * 
 * 작성자: 네코즈카 히비키 (엔지니어부)
 */

// 1. 설정 및 불변 상수를 하나의 객체로 관리
const PRACTICE_CONSTANTS = {
    MODULE_ID: "PRACTICE_01",
    TARGET_FPS: 60,
    SYSTEM_THRESHOLD: 0.85,
    THEME_COLORS: {
        PRIMARY: 0x00ff88,
        SECONDARY: 0xffdd00,
        BACKGROUND: 0x1a1a1a
    }
};

/**
 * 2. 시스템 기능을 클래스 내부로 캡슐화
 */
class EngineeringPractice {
    constructor(initPower = 100) {
        // 내부 데이터 (상태)
        this._powerLevel = initPower;
        this._isStable = true;
        this._operationLog = [];
        
        console.log(`[실습 가동] 모듈 ${PRACTICE_CONSTANTS.MODULE_ID} 초기화 완료.`);
    }

    /**
     * 외부에서 시스템 출력을 안전하게 조정하는 메서드
     */
    adjustPower(amount) {
        if (!this._isStable) {
            this._log("경고: 시스템이 불안정하여 출력을 조정할 수 없습니다.");
            return;
        }

        this._powerLevel += amount;
        this._log(`출력 조정됨: ${this._powerLevel}`);

        // 안전 수치 검사 로직
        if (this._powerLevel > 1000) {
            this._triggerSafetyLock();
        }
    }

    /**
     * 프라이빗 성격의 시스템 잠금 함수
     */
    _triggerSafetyLock() {
        this._isStable = false;
        this._log("위험: 과부하 감지! 안전을 위해 시스템을 잠금 처리합니다.");
    }

    /**
     * 로그 기록 유틸리티
     */
    _log(message) {
        const time = new Date().toLocaleTimeString();
        this._operationLog.push(`[${time}] ${message}`);
        console.log(`[${PRACTICE_CONSTANTS.MODULE_ID}] ${message}`);
    }

    /**
     * 현재 상태 리포트 Getter
     */
    getSummary() {
        return {
            level: this._powerLevel,
            stable: this._isStable,
            logCount: this._operationLog.length
        };
    }
}

// 실습 가동 인스턴스 (예시)
// const practice = new EngineeringPractice(500);
// practice.adjustPower(600);
