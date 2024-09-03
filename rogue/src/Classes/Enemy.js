// Enemy.js
let enemyInstances = []; // Переменная для хранения всех экземпляров врагов

class Enemy {
  constructor() {
    if (enemyInstances.length < 10) {
      this.health = 50;
      this.attack = 15;
      enemyInstances.push(this);
    }
  }

  takeDamage(amount) {
    this.health = Math.max(this.health - amount, 0);
    return this.health;
  }
}

export { Enemy, enemyInstances };
