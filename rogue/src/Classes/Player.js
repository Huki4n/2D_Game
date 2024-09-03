let playerInstance = null;

class Player {
  constructor() {
    if (!playerInstance) {
      this.health = 100;
      this.attack = 10;
      playerInstance = this;
    }
    return playerInstance;
  }

  takeDamage(amount) {
    this.health = Math.max(this.health - amount, 0);
    return this.health;
  }

  heal(amount) {
    this.health = Math.min(this.health + amount, 100);
    return this.health;
  }

  increaseAttack(amount) {
    this.attack += amount;
  }
}

export { Player, playerInstance}
