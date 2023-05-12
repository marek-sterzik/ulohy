function intdiv(a, b)
{
    return (a - a%b)/b
}

const direction = {
    "left": {"x": -1, "y": 0},
    "right": {"x": 1, "y": 0},
    "up": {"x": 0, "y": -1},
    "down": {"x": 0, "y": 1},
}

function setCellState(board, x, y, state, growFactor)
{
    const cell = board.board[y][x]
    cell.type = state
    cell.el.removeClass().addClass(state)
    cell.growFactor = growFactor
    if (cell.growFactor > 0) {
        cell.el.text(cell.growFactor)
    } else {
        cell.el.text("")
    }
}

function rand(n)
{
    return Math.floor(Math.random() * 1000000000) % n;
}

function placeRandomPrey(board, growFactor)
{
    var x, y
    do {
        x = rand(board.x)
        y = rand(board.y)
    } while(board.board[y][x]["type"] != "empty")
    setCellState(board, x, y, "prey", growFactor)
}

function createSnakeboard(element, x, y)
{
    var state = {
        "snake": [{"x": intdiv(x, 2), "y": intdiv(y, 2)}],
        "nextDirection": direction.up,
        "prevDirection": direction.up,
        "growFactor": 3,
        "x": x,
        "y": y,
        "board": []
    }
    for (i = 0; i < y; i++) {
        var row = $("<tr>")
        var boardRow = []
        for (j = 0; j < x; j++) {
            var cell= $("<td>")
            var boardCell = {"type": "empty", "growFactor": 0, "el": cell}
            cell.addClass("empty")
            row.append(cell)
            boardRow.push(boardCell)
        }
        element.append(row)
        state.board.push(boardRow)
    }

    for (var coords of state.snake) {
        setCellState(state, coords.x, coords.y, "snake", 0)
    }

    placeRandomPrey(state, 1)

    return state
}

function tick(board)
{
    const snakeHead = board.snake[board.snake.length - 1]
    const nextHead = {"x": snakeHead.x + board.nextDirection.x, "y": snakeHead.y + board.nextDirection.y}
    if (nextHead.x < 0 || nextHead.x >= board.x || nextHead.y < 0 || nextHead.y >= board.y) {
        return false
    }
    const nextCell = board.board[nextHead.y][nextHead.x]
    if (nextCell.type == 'wall') {
        return false
    }
    if (nextCell.growFactor >= 9) {
        return false
    }
    board.growFactor += nextCell.growFactor
    board.snake.push(nextHead)
    board.prevDirection = board.nextDirection
    var nextGrowFactor = 0
    if (nextCell.growFactor > 0) {
        nextGrowFactor = nextCell.growFactor + 1
    }
    setCellState(board, nextHead.x, nextHead.y, "snake", 0)
    if (board.growFactor > 0) {
        board.growFactor--
    } else {
        const snakeTail = board.snake.shift()
        setCellState(board, snakeTail.x, snakeTail.y, "empty", 0)
    }
    if (nextGrowFactor > 0) {
        placeRandomPrey(board, nextGrowFactor)
    }
    return true
}

function setDirection(board, dir)
{
    const x = board.prevDirection.x + dir.x
    const y = board.prevDirection.y + dir.y
    if (x != 0 || y != 0) {
        board.nextDirection = dir
    }
}

function keyPress(board, keycode)
{
    const dir = getDirection(keycode)
    if (dir === null) {
        return false
    }
    setDirection(board, dir)
    return true
}

function getDirection(keycode)
{
    switch(keycode) {
    case 37: return direction.left
    case 38: return direction.up
    case 39: return direction.right
    case 40: return direction.down
    default: return null
    }
}

$(document).ready(function() {
    var state = createSnakeboard($('table.snakeboard'), 30, 30)
    $(document).on("keydown", function(ev){
        if (keyPress(state, ev.which)) {
            ev.preventDefault()
            return false
        }
    })
    interval = setInterval(function (){
        if (!tick(state)) {
            clearInterval(interval)
        }
    }, 100)
})
