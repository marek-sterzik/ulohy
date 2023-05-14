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

const links = {
    "border": {"v": "none", "h": "none"},
    "mobiusStrip": {"v": "none", "h": "flipped"},
    "kleinBottle": {"v": "normal", "h": "flipped"},
    "projectivePlane": {"v": "flipped", "h": "flipped"},
}

function flipDirection(dir, hFlip, vFlip)
{
    return {"x": dir.x * (hFlip ? (-1) : 1), "y": dir.y * (vFlip ? (-1) : 1)}
}

function setCellState(board, x, y, state, growFactor)
{
    const cell = board.board[y][x]
    cell.type = state
    cell.el.removeClass().addClass(state)
    cell.growFactor = growFactor
    if (cell.growFactor > 0) {
        cell.el.find("span").text(cell.growFactor)
    } else {
        cell.el.find("span").text("")
    }
}

function parseWallCommand(wallsCode)
{
    wallsCode = wallsCode.toUpperCase().replace(/\s+/,'')
    var match = wallsCode.match(/^<([0-9]+),([0-9]+)>(.*)$/)
    if (match) {
        return {
            "command": "<>",
            "point": {"x": parseInt(match[1]),"y": parseInt(match[2])},
            "rest": match[3],
        }
    }
    match = wallsCode.match(/^(.)(.*)$/)
    if (match) {
        return {
            "command": match[1],
            "point": null,
            "rest": match[2],
        }
    }

    return {
        "command": "",
        "point": null,
        "rest": "",
    }
}

function drawWallPoint(board, point)
{
    if (point.x >= 0 && point.y >= 0 && point.x < board.x && point.y < board.y) {
        setCellState(board, point.x, point.y, "wall", 0)
    }
}

function* generateValues(from, to)
{
    if (to >= from) {
        for (var i = from; i <= to; i++) {
            yield i
        }
    } else {
        for (var i = from; i >= to; i--) {
            yield i
        }
    }
}

function drawWallLine(board, point1, point2)
{
    if (Math.abs(point1.x - point2.x) > Math.abs(point1.y - point2.y)) {
        for (var x of generateValues(point1.x, point2.x)) {
            y = point1.y + Math.round((point2.y - point1.y)*(x - point1.x)/(point2.x - point1.x))
            drawWallPoint(board, {"x": x, "y": y})
        }
    } else if (Math.abs(point1.y - point2.y) > 0) {
        for (var y of generateValues(point1.y, point2.y)) {
            x = point1.x + Math.round((point2.x - point1.x)*(y - point1.y)/(point2.y - point1.y))
            drawWallPoint(board, {"x": x, "y": y})
        }
    } else {
        drawWallPoint(board, point1)
    }
}

function drawWalls(board, wallsCode)
{
    var lastPoint = {"x": 0, "y": 0}
    var point = Object.assign({}, lastPoint)
    var draw = false
    var invalid, moveLastPoint
    while (wallsCode != "") {
        invalid = false
        moveLastPoint = false
        parsed = parseWallCommand(wallsCode)
        wallsCode = parsed.rest
        switch (parsed.command) {
        case 'L':
            point.x--
            break
        case 'R':
            point.x++
            break
        case 'U':
            point.y--
            break
        case 'D':
            point.y++
            break
        case '+':
            draw = true
            break
        case '-':
            draw = false
            break;
        case 'X':
            drawWallPoint(board, point)
            moveLastPoint = true
            break;
        case 'M':
            moveLastPoint = true
            break;
        case '<>':
            point = parsed.point
            moveLastPoint = true
            break
        default:
            invalid = true
            break;
        }
        if (invalid) {
            continue
        }
        if (draw) {
            drawWallLine(board, lastPoint, point)
        }
        if (draw || moveLastPoint) {
            lastPoint = Object.assign({}, point)
        }
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

function setupTemplateDefaults(template)
{
    template = Object.assign({}, template)
    const mandatoryFields = ["width", "height"]
    for (var field of mandatoryFields) {
        if (! (field in template)) {
            throw "field is mandatory in snake template: " + field
        }
    }
    if (! ("snakeX" in template)) {
        template.snakeX = intdiv(template.width, 2)
    }

    if (! ("snakeY" in template)) {
        template.snakeY = intdiv(template.height, 2)
    }

    if (! ("snakeLength" in template)) {
        template.snakeLength = 4
    }
    if (template.snakeLength < 1) {
        template.snakeLength = 1
    }

    if (! ("snakeDirection" in template)) {
        template.snakeDirection = direction.up
    }

    if (! ("links" in template)) {
        template.links = links.border
    }

    if (! ("flipDirections" in template)) {
        template.flipDirections = false
    }

    if (! ("walls" in template)) {
        template.walls = ""
    }
    return template
}

function createSnakeboard(element, template)
{
    template = setupTemplateDefaults(template)
    console.log(template)
    var state = {
        "state": "run",
        "snake": [{"x": template.snakeX, "y": template.snakeY}],
        "nextDirection": template.snakeDirection,
        "prevDirection": template.snakeDirection,
        "directionStack": null,
        "growFactor": template.snakeLength - 1,
        "x": template.width,
        "y": template.height,
        "links": template.links,
        "flipDirections": template.flipDirections,
        "vFlip": false,
        "hFlip": false,
        "board": []
    }
    element.html("")
    for (i = 0; i < state.y; i++) {
        var row = $("<tr>")
        var boardRow = []
        for (j = 0; j < state.x; j++) {
            var cell= $("<td><span></span></td>")
            var boardCell = {"type": "empty", "growFactor": 0, "el": cell}
            cell.addClass("empty")
            row.append(cell)
            boardRow.push(boardCell)
        }
        element.append(row)
        state.board.push(boardRow)
    }

    drawWalls(state, template.walls)

    for (var coords of state.snake) {
        setCellState(state, coords.x, coords.y, "snake", 0)
    }

    placeRandomPrey(state, 1)

    return state
}

function tick(board)
{
    if (board.state == 'run') {
        return tickRun(board)
    } else if (board.state == 'done'){
        return tickDone(board)
    } else {
        return tickCrash(board)
    }
}

function tickDone(board)
{
    if (board.snake.length == 0) {
        return false
    }
    const snakeTail = board.snake.shift()
    setCellState(board, snakeTail.x, snakeTail.y, "empty", 0)
    return true
}

function tickCrash(board)
{
    if ("crashState" in board) {
        board.crashState ++
    } else {
        board.crashState = 0
    }
    const crashState = intdiv(board.crashState, 2)
    for (var bodyPart of board.snake) {
        setCellState(board, bodyPart.x, bodyPart.y, (crashState % 2) ? "snake" : "empty", 0)
    }
    if (crashState >= 6) {
        return false
    }
    return true
}

function opositeDirections(dir1, dir2)
{
    if (dir1.x + dir2.x == 0 && dir1.y + dir2.y == 0) {
        return true
    } else {
        return false
    }
}

function tickRun(board)
{
    const snakeHead = board.snake[board.snake.length - 1]
    const nextHead = {"x": snakeHead.x + board.nextDirection.x, "y": snakeHead.y + board.nextDirection.y}
    if (nextHead.x < 0 || nextHead.x >= board.x) {
        if (board.links.h == "normal" || board.links.h == "flipped") {
            nextHead.x = (board.x + nextHead.x) % board.x
            if (board.links.h == "flipped") {
                nextHead.y = board.y - nextHead.y - 1;
                if (board.flipDirections) {
                    board.vFlip = !board.vFlip
                    if (board.directionStack !== null) {
                        board.directionStack = flipDirection(board.directionStack, false, true)
                    }
                }
            }
        } else {
            board.state = "crash"
            return true
        }
    }
    if (nextHead.y < 0 || nextHead.y >= board.y) {
        if (board.links.v == "normal" || board.links.v == "flipped") {
            nextHead.y = (board.y + nextHead.y) % board.y
            if (board.links.v == "flipped") {
                nextHead.x = board.x - nextHead.x - 1;
                if (board.flipDirections) {
                    board.hFlip = !board.hFlip
                    if (board.directionStack !== null) {
                        board.directionStack = flipDirection(board.directionStack, true, false)
                    }
                }
            }
        } else {
            board.state = "crash"
            return true
        }
    }

    const nextCell = board.board[nextHead.y][nextHead.x]
    if (nextCell.type == 'wall' || nextCell.type == 'snake') {
        board.state = "crash"
        return true
    }
    var everythingEaten = false
    if (nextCell.growFactor >= 9) {
        everythingEaten = true
    }
    board.growFactor += nextCell.growFactor
    board.snake.push(nextHead)
    board.prevDirection = board.nextDirection
    if (board.directionStack !== null) {
        if (!opositeDirections(board.nextDirection, board.directionStack)){
            board.nextDirection = board.directionStack
        }
        board.directionStack = null
    }
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
    if (!everythingEaten && nextGrowFactor > 0) {
        placeRandomPrey(board, nextGrowFactor)
    }
    if (everythingEaten) {
        board.state = "done"
    }
    return true
}

function setDirection(board, dir)
{
    dir = flipDirection(dir, board.hFlip, board.vFlip)
    const x = board.prevDirection.x + dir.x
    const y = board.prevDirection.y + dir.y
    if (x != 0 || y != 0) {
        board.nextDirection = dir
    } else {
        board.directionStack = dir
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
    template = {"width": 30, "height": 30, "snakeX": 15, "snakeY": 14, "links": links.projectivePlane, "flipDirections": true, "walls": "<4,0>+<25,29>"}
    var state = createSnakeboard($('table.snakeboard'), template)
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
    }, 150)
})
