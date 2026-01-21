const STATES = {
  IDLE: "IDLE",
  LISTENING: "LISTENING",
  PROCESSING: "PROCESSING",
  SPEAKING: "SPEAKING",
  INTERRUPTED: "INTERRUPTED"
};

class StateMachine {

  constructor() {
    this.state = STATES.IDLE;
  }

  setState(newState) {
    console.log(`STATE: ${this.state} → ${newState}`);
    this.state = newState;
  }

  getState() {
    return this.state;
  }
}

module.exports = { StateMachine, STATES };
