const w : number = window.innerWidth
const h : number = window.innerHeight
const scGap : number = 0.02
const strokeFactor : number = 90
const sizeFactor : number = 2.9
const rFactor : number = 30
const delay : number = 30
const nodes : number = 5
const corners : number = 4
const foreColor : string = "#2196f3"
const backColor : string = "#BDBDBD"

class ScaleUtil {

    static maxScale(scale : number, i : number, n : number) : number {
        return Math.max(0, scale - i / n)
    }

    static divideScale(scale : number, i : number, n : number) : number {
        return Math.min(1 / n, ScaleUtil.maxScale(scale, i, n)) * n
    }

    static sinify(scale : number) : number {
        return Math.sin(scale * Math.PI)
    }
}

class DrawingUtil {

    static drawCircle(context : CanvasRenderingContext2D, x : number, y : number, r : number) {
        context.beginPath()
        context.arc(x, y, r, 0, 2 * Math.PI)
        context.fill()
    }

    static drawBouncyCornerBall(context : CanvasRenderingContext2D, i : number, scale : number, size : number) {
        const sc : number = ScaleUtil.divideScale(scale, i, corners)
        const sf : number = ScaleUtil.sinify(sc)
        const r : number = size / rFactor
        context.save()
        context.rotate(i * Math.PI / 2)
        DrawingUtil.drawCircle(context, size * sc, 0, r)
        context.restore()
    }

    static drawBouncyCornerBalls(context : CanvasRenderingContext2D, scale : number, size : number) {
        for (var i = 0; i < corners; i++) {
            DrawingUtil.drawBouncyCornerBall(context, i, scale, size)
        }
    }

    static drawBBCMNode(context : CanvasRenderingContext2D, i : number, scale : number) {
        context.fillStyle = foreColor
        const gap : number = h / (nodes + 1)
        const size : number = gap / sizeFactor
        context.save()
        context.translate(w / 2, gap * (i + 1))
        DrawingUtil.drawBouncyCornerBalls(context, scale, size)
        context.restore()
    }
}

class Stage {

    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor
        this.context.fillRect(0, 0, w, h)
    }

    handleTap() {
        this.canvas.onmousedown = () => {

        }
    }

    static init() {
        const stage : Stage = new Stage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {

    scale : number = 0
    dir : number = 0
    prevScale : number = 0

    update(cb : Function) {
        this.scale += scGap * this.dir
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {

    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, delay)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class BBCMNode {

    next : BBCMNode
    prev : BBCMNode
    state : State = new State()

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new BBCMNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        DrawingUtil.drawBBCMNode(context, this.i, this.state.scale)
        if (this.next) {
            this.next.draw(context)
        }
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : BBCMNode {
        var curr : BBCMNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class BouncyBallCornerMover {

    root : BBCMNode = new BBCMNode(0)
    curr : BBCMNode = this.root
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.root.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {

    animator : Animator = new Animator()
    bbcm : BouncyBallCornerMover = new BouncyBallCornerMover()

    render(context : CanvasRenderingContext2D) {
        this.bbcm.draw(context)
    }

    handleTap(cb : Function) {
        this.bbcm.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.bbcm.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }

}
