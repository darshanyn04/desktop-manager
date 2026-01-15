import robot from 'robotjs';

export function getCursorPosition() {
  const pos = robot.getMousePos();
  return { x: pos.x, y: pos.y };
}
