const direction = {
    "left": {"x": -1, "y": 0},
    "right": {"x": 1, "y": 0},
    "up": {"x": 0, "y": -1},
    "down": {"x": 0, "y": 1},
}

const links = {
    "border": {"v": "none", "h": "none"},
    "torus": {"v": "normal", "h": "normal"},
    "mobiusStrip": {"v": "none", "h": "flipped"},
    "mobiusStripFlipped": {"v": "flipped", "h": "none"},
    "kleinBottle": {"v": "normal", "h": "flipped"},
    "kleinBottleFlipped": {"v": "flipped", "h": "normal"},
    "projectivePlane": {"v": "flipped", "h": "flipped"},
}

function setCellStateOld(board, x, y, state, growFactor)
{
}

////////////////////////////////////////////////////////////////////////////////////////////
// Already refactored

function intdiv(a, b)
{
    return (a - a%b)/b
}

function flipDirection(dir, hFlip, vFlip)
{
    return {"x": dir.x * (hFlip ? (-1) : 1), "y": dir.y * (vFlip ? (-1) : 1)}
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

function rand(n)
{
    return Math.floor(Math.random() * 1000000000) % n;
}

function opositeDirections(dir1, dir2)
{
    if (dir1.x + dir2.x == 0 && dir1.y + dir2.y == 0) {
        return true
    } else {
        return false
    }
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

    if (! ("speed" in template)) {
        template.speed = 150
    }
    return template
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

class WallDrawer
{
    constructor(snakeBoard)
    {
        this.snakeBoard = snakeBoard
    }

    drawPoint(point)
    {
        const size = this.snakeBoard.size()
        if (point.x >= 0 && point.y >= 0 && point.x < size.x && point.y < size.y) {
            this.snakeBoard.setCellState(point, "wall", 0)
        }
    }

    drawLine(point1, point2)
    {
        if (Math.abs(point1.x - point2.x) > Math.abs(point1.y - point2.y)) {
            for (var x of generateValues(point1.x, point2.x)) {
                y = point1.y + Math.round((point2.y - point1.y)*(x - point1.x)/(point2.x - point1.x))
                this.drawPoint({"x": x, "y": y})
            }
        } else if (Math.abs(point1.y - point2.y) > 0) {
            for (var y of generateValues(point1.y, point2.y)) {
                x = point1.x + Math.round((point2.x - point1.x)*(y - point1.y)/(point2.y - point1.y))
                this.drawPoint({"x": x, "y": y})
            }
        } else {
            this.drawPoint(point1)
        }
    }

    parseWallCommand(wallsCode)
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

    drawWalls(wallsCode)
    {
        var lastPoint = {"x": 0, "y": 0}
        var point = Object.assign({}, lastPoint)
        var draw = false
        var invalid, moveLastPoint, parsed
        while (wallsCode != "") {
            invalid = false
            moveLastPoint = false
            parsed = this.parseWallCommand(wallsCode)
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
                this.drawPoint(point)
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
                this.drawLine(lastPoint, point)
            }
            if (draw || moveLastPoint) {
                lastPoint = Object.assign({}, point)
            }
        }
    }

}

class SnakeBoardPrivate
{
    constructor()
    {
        this.wallDrawer = new WallDrawer(this)
        this.interval = null
        this.tickFunction = null
        this.element = $("<table>").addClass("snakeboard")
    }

    setDirection(dir)
    {
        dir = flipDirection(dir, this.state.hFlip, this.state.vFlip)
        if (opositeDirections(this.state.prevDirection, dir)) {
            if (!opositeDirections(this.state.nextDirection, dir)) {
                this.state.directionStack = dir
            }
        } else {
            this.state.nextDirection = dir
        }
    }

    tick()
    {
        if (this.state.state == 'run') {
            return this.tickRun()
        } else if (this.state.state == 'done') {
            return this.tickDone()
        } else if (this.state.state == 'init') {
            return true
        } else if (this.state.state == 'stopped') {
            return false
        } else {
            return this.tickCrash()
        }
    }

    tickDone()
    {
        if (this.state.snake.length == 0) {
            return false
        }
        const snakeTail = this.state.snake.shift()
        this.setCellState(snakeTail, "empty", 0)
        return true
    }

    tickCrash()
    {
        if ("crashState" in this.state) {
            this.state.crashState ++
        } else {
            this.state.crashState = 0
        }
        const crashState = intdiv(this.state.crashState, 2)
        for (var bodyPart of this.state.snake) {
            this.setCellState(bodyPart, (crashState % 2) ? "snake" : "empty", 0)
        }
        if (crashState >= 6) {
            return false
        }
        return true
    }

    tickRun()
    {
        const snakeHead = this.state.snake[this.state.snake.length - 1]
        const nextHead = {"x": snakeHead.x + this.state.nextDirection.x, "y": snakeHead.y + this.state.nextDirection.y}
        if (nextHead.x < 0 || nextHead.x >= this.state.x) {
            if (this.state.links.h == "normal" || this.state.links.h == "flipped") {
                nextHead.x = (this.state.x + nextHead.x) % this.state.x
                if (this.state.links.h == "flipped") {
                    nextHead.y = this.state.y - nextHead.y - 1;
                    if (this.state.flipDirections) {
                        this.state.vFlip = !this.state.vFlip
                        if (this.state.directionStack !== null) {
                            this.state.directionStack = flipDirection(this.state.directionStack, false, true)
                        }
                    }
                }
            } else {
                this.state.state = "crash"
                return true
            }
        }
        if (nextHead.y < 0 || nextHead.y >= this.state.y) {
            if (this.state.links.v == "normal" || this.state.links.v == "flipped") {
                nextHead.y = (this.state.y + nextHead.y) % this.state.y
                if (this.state.links.v == "flipped") {
                    nextHead.x = this.state.x - nextHead.x - 1;
                    if (this.state.flipDirections) {
                        this.state.hFlip = !this.state.hFlip
                        if (this.state.directionStack !== null) {
                            this.state.directionStack = flipDirection(this.state.directionStack, true, false)
                        }
                    }
                }
            } else {
                this.state.state = "crash"
                return true
            }
        }

        const nextCell = this.state.board[nextHead.y][nextHead.x]
        if (nextCell.type == 'wall' || nextCell.type == 'snake') {
            this.state.state = "crash"
            return true
        }
        var everythingEaten = false
        if (nextCell.growFactor >= 9) {
            everythingEaten = true
        }
        this.state.growFactor += nextCell.growFactor
        this.state.snake.push(nextHead)
        this.state.prevDirection = this.state.nextDirection
        if (this.state.directionStack !== null) {
            if (!opositeDirections(this.state.nextDirection, this.state.directionStack)){
                this.state.nextDirection = this.state.directionStack
            }
            this.state.directionStack = null
        }
        var nextGrowFactor = 0
        if (nextCell.growFactor > 0) {
            nextGrowFactor = nextCell.growFactor + 1
        }
        this.setCellState(nextHead, "snake", 0)
        if (this.state.growFactor > 0) {
            this.state.growFactor--
        } else {
            const snakeTail = this.state.snake.shift()
            this.setCellState(snakeTail, "empty", 0)
        }
        if (!everythingEaten && nextGrowFactor > 0) {
            this.placeRandomPrey(nextGrowFactor)
        }
        if (everythingEaten) {
            this.state.state = "done"
        }
        return true
    }

    placeRandomPrey(growFactor)
    {
        var x, y
        do {
            x = rand(this.state.x)
            y = rand(this.state.y)
        } while(this.state.board[y][x]["type"] != "empty")
        this.setCellState({"x": x, "y": y}, "prey", growFactor)
    }

    setCellState(point, type, growFactor)
    {
        const cell = this.state.board[point.y][point.x]
        cell.type = type
        cell.el.removeClass().addClass(type)
        cell.growFactor = growFactor
        if (cell.growFactor > 0) {
            cell.el.find("span").text(cell.growFactor)
        } else {
            cell.el.find("span").text("")
        }
    }
}

class SnakeBoard extends SnakeBoardPrivate
{
    constructor(template)
    {
        super()
        this.loadTemplate(template)
    }

    running()
    {
        return this.interval !== null
    }

    stop()
    {
        if (this.running()) {
            this.state.state = "stopped"
            if (board.tickFunction) {
                const fn = board.tickFunction
                fn()
            }
        }
    }

    run()
    {
        var board = this
        return new Promise(function (success, failure) {
            if(!board.running()) {
                board.tickFunction = function() {
                    if (!board.tick()) {
                        clearInterval(board.interval)
                        board.initerval = null
                        board.tickFunction = null
                        success(board.state.state)
                    }
                }
                board.interval = setInterval(board.tickFunction, board.state.speed)
            } else {
                failure("cannot run already running board")
            }
        })
    }

    loadTemplate(template)
    {
        if (this.running()) {
            throw "Cannot load template into a running game"
        }
        this.element.html("")
        template = setupTemplateDefaults(template)
        this.state = {
            "state": "init",
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
            "board": [],
            "speed": template.speed
        }
        for (var i = 0; i < this.state.y; i++) {
            var row = $("<tr>")
            var boardRow = []
            for (var j = 0; j < this.state.x; j++) {
                var cell= $("<td><span></span></td>")
                var boardCell = {"type": "empty", "growFactor": 0, "el": cell}
                cell.addClass("empty")
                row.append(cell)
                boardRow.push(boardCell)
            }
            this.element.append(row)
            this.state.board.push(boardRow)
        }

        this.wallDrawer.drawWalls(template.walls)

        for (var coords of this.state.snake) {
            this.setCellState(coords, "snake", 0)
        }

        this.placeRandomPrey(1)
    }
    
    appendElementTo(element)
    {
        $(element).append(this.element)
    }

    bindKeys()
    {
        const board = this
        $(document).on("keydown", function(ev){
            if (board.keyPress(ev.which)) {
                ev.preventDefault()
                return false
            }
        })
    }

    keyPress(keyCode)
    {
        if (this.state.state == 'init') {
            this.state.state="run"
            return true
        }
        const dir = getDirection(keyCode)
        if (dir === null) {
            return false
        }
        this.setDirection(dir)
        return true
    }

    size()
    {
        return {"x": this.state.x, "y": this.state.y}
    }
}

$(document).ready(function() {
    template = {"speed": 150, "width": 30, "height": 30, "snakeX": 15, "snakeY": 14, "links": links.projectivePlane, "flipDirections": true, "walls": "<5,0>+<24,29>"}
    var board = new SnakeBoard(template)
    board.appendElementTo($("div.snakeboard"))
    board.bindKeys()
    board.run().then((state) => console.log("Game ended with state: " + state))
})
