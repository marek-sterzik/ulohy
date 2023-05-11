/*
 * Pomocna funkce vytvarejici plynulou animacni funkci.
 */
function createSmoothStepFunction(time, from, to)
{
    const t = Math.min(500, time/2)
    const K = (x) => x*x*x*(1-x/2)
    const C = time - t
    const basicStepFunction = (x) => {
        if (x < 0){
            return 0
        } else if (x <= t) {
            return t*K(x/t)/C
        } else if (x <= time-t) {
            return (x-t/2)/C
        } else if (x <= time) {
            return 1 - t*K((time-x)/t)/C
        } else {
            return 1
        }
    }
    return (x) => from + (to - from) * basicStepFunction(x)
}

/*
 * Pomocna funkce provadejici normalizaci uhlu.
 */
function normalizeAngle(angle)
{
    while(angle >= 360) {
        angle -= 360
    }
    while(angle < 0) {
        angle += 360
    }
    return angle
}

/*
 * Funkce animate(time, valueInterval, stepFunction, finishFunction)
 * provadi plynulou animaci hodnoty v case.
 *
 * Argumenty:
 *   - time - celkova doba animace v MILISEKUNDACH
 *   - valueInterval  - objekt reprezentujici interval v jakem se ma
 *                      hodnota menit. Objekt je ve stejnem formatu,
 *                      ktery tvori funkce calculateRotationInterval().
 *                      Vysledek volani calculateRotationInterval()
 *                      jde tedy primo predat jako hodnotu tohoto
 *                      argumentu.
 *   - stepFunction   - funkce, ktera se ma volat v kazdem kroku
 *                      animace. Funkce musi mit prave jeden argument
 *                      a jejim ucelem je promitnout aktualni animovanou
 *                      hodnotu do sceny
 *   - finishFunction - tato funkce se zavola ve chvili, kdy je cela
 *                      animace dokoncena. Tento parametr je NEPOVINNY
 *                      a nemusi se uvadet
 *
 * Navratova hodnota:
 *   Objekt typu promise, ktery reprezentuje dokonceni cele animace.
 *
 * Reakci na dokonceni cele animace lze tedy realizovat dvema zpusoby
 * a je jedno, ktery si vyberete:
 *   1. klasicky predanim finishFunction
 *   2. pomoci promisu
 *
 * Priklad pouziti (bez pouziti finishFunction):
 *
 * animate(5000, {"from": 0, "to": 100}, function(x) {
 *     $('#progress-bar').css('width', x + "%")
 * })
 */
function animate(time, valueInterval, stepFunction, finishFunction)
{
    const promise = new Promise(function (finishFunction) {
        const stepTime = 10
        const stepValue = createSmoothStepFunction(time, valueInterval.from, valueInterval.to)
        var x = 0
        stepFunction(stepValue(x))
        var interval;
        interval = setInterval(function(){
            x += stepTime
            stepFunction(stepValue(x))
            if (x >= time) {
                clearInterval(interval)
                finishFunction()
            }
        }, stepTime)
    })
    if (finishFunction) {
        promise.then(finishFunction)
    }
    return promise
}

/*
 * Funkce calculateRotationInterval(currentRotation, expectedRotation)
 * vypocita odkud kam se ma pootocit scena, aby to bylo nejkratsi.
 *
 * Argumenty:
 *   - currentRotation - aktualni pootoceni sceny ve STUPNICH
 *   - expectedRotation - cilove pootoceni sceny ve STUPNICH
 *
 * Navratova hodnota:
 *   Objekt obsahujici hodnotu "from" a "to" urcujici startovni
 *   a cilove pootoceni sceny, aby rotace byla nejkratsi mozna.
 *
 * Tato funkce resi problem, zda je kratsi pootocit scenu po smeru
 * nebo proti smeru hodinovych rucicek. Vysledkem volani
 *
 * calculateRotationInterval(0, 10)
 *
 * bude tedy objekt {"from": 0, "to": 10}
 *
 * ale vysledkem volani
 *
 * calculateRotationInterval(10, 350)
 *
 * bude objekt {"from": 370, "to": 350}
 *
 * Funkce predpoklada, ze rotace se nemusi uvadet v zakladnim tvaru,
 * coz napriklad css transform vlastnost rotate() splnuje.
 * Diky tomu lze kazde pootoceni vzdy vyjadrit jako nejaky interval.
 * Kdybychom totiz predpokladali zakladni tvar, museli bychom rotaci
 * od 10 do 350 rozdelit na dve: 1. od 10 do 0 a 2. od 360 do 350.
 * TIM SE ALE NENI NUTNE ZABYVAT, PROTOZE VSECHNY FUNKCE UMI I NEKANONICKE
 * ROTACE, TJ. UHLY MIMO ROZSAH [0, 360] STUPNU.
 */

function calculateRotationInterval(currentRotation, expectedRotation)
{
    currentRotation = normalizeAngle(currentRotation)
    expectedRotation = normalizeAngle(expectedRotation)
    const track1 = Math.abs(expectedRotation - currentRotation)
    const track2 = Math.abs(expectedRotation - (currentRotation + 360))
    const track3 = Math.abs(expectedRotation - ( currentRotation - 360))
    if (track1 <= track2 && track1 <= track3) {
        return {"from": currentRotation, "to": expectedRotation}
    } else if (track2 <= track1 && track2 <= track3) {
        return {"from": currentRotation + 360, "to": expectedRotation}
    } else {
        return {"from": currentRotation - 360, "to": expectedRotation}
    }
}

