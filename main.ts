import {parse} from "csv-parse/sync";
import {readFile} from "fs/promises";


interface BingoGoal {
    name: string,
    categories: string[]
    type: "short" | "medium" | "long"
}

interface csvGoal {
    'Goal Name': string,
    Collection: string,
    Boss: String,
    Domain: string,
    NPCs: string,
    Fighting: string,
    Traveling: string,
    Team: string,
    'Misc.': string
}

let goals: BingoGoal[] = [];
let categoryAmount = Object.fromEntries([['collection', 0], ['boss', 0], ['domain', 0], ['npcs', 0], ['fighting', 0], ['traveling', 0], ['team', 0], ['misc.', 0]]);
let typeAmount = {'short': 0, 'medium': 0, 'long': 0};
let rerun = 0;
let isRerun = false;

function addGoal(allowedToRunReruns : boolean) : BingoGoal | void {
    let min = Math.min(...Object.values(categoryAmount));
    let index = Math.floor(Math.random() * goals.length);
    let selectedGoal = goals[index];
    let minCat : string = Object.entries(categoryAmount).filter((key, value) =>
        value === min
    )[0][0];
    if (allowedToRunReruns && !isRerun && !selectedGoal.categories.includes(minCat) && 1 <= categoryAmount[minCat] && categoryAmount[minCat] <= 5) {
        rerun++;
        isRerun = true;
        return;
    } else {
        isRerun = false;
    }
    selectedGoal.categories.forEach((cat) => {
        categoryAmount[cat]++;
    })
    typeAmount[selectedGoal.type]++;
    if (typeAmount['short'] === 10) {
        goals = goals.filter((goal) => goal.type != 'short')
    }
    if (typeAmount['medium'] === 10) {
        goals = goals.filter((goal) => goal.type != 'medium')
    }
    if (typeAmount['long'] === 5) {
        goals = goals.filter((goal) => goal.type != 'long')
    }
    goals.splice(index, 1);
    return selectedGoal;
}

function selectGoals() {
    
    let selectedGoals : BingoGoal[] = [];
    for (let i = 0; i < 25; i++ ) {
        let goal = addGoal(true);
        if (goal) {
            selectedGoals.push(goal);
        }
     }
    for (let i = 0; i < rerun; i++) {
        let goal = addGoal(false);
        if (goal) {
            selectedGoals.push(goal);
        }
    }
    
    return selectedGoals;
}

function processCSV(records: csvGoal[], type: "short" | "medium" | "long") {
    records.forEach((row: csvGoal) => {
        let categories : string[] = [];
        Object.entries(row).forEach(([key, value]) => {
            if (value === 'TRUE') {
                categories.push(key.toLowerCase());
            }
        });
        const newGoal : BingoGoal = {
            name: row["Goal Name"],
            categories: categories,
            type: type
        }
        goals.push(newGoal);
    });
}

async function main() {
    
    const short = await readFile(__dirname + '/Genshin Bingo Goals Categorized - Short Goals.csv');
    const parsedShort = parse(short, {columns: true, from_line: 2});
    processCSV(parsedShort, "short");
    
    const medium = await readFile(__dirname + '/Genshin Bingo Goals Categorized - Medium-length Goals.csv');
    const parsedMedium = parse(medium, {columns: true, from_line: 2});
    processCSV(parsedMedium, "medium");
    
    const long = await readFile(__dirname + '/Genshin Bingo Goals Categorized - Long Goals.csv');
    const parsedLong = parse(long, {columns: true, from_line: 2});
    processCSV(parsedLong, "long");
    
    return selectGoals();
    
}

main().then((data) => {
        let allGoals = data.map((goal) => { return goal.name});
        let returnString = '';
        for (let i = 0; i < 25; i++) {
            if (i === 0) {
                returnString += `[{"name": "${allGoals[i]}"},`;
                continue;
            }
            if (i === 24) {
                returnString += `{"name": "${allGoals[i]}"}]`
                continue
            }
            returnString += `{"name": "${allGoals[i]}"},`
        }
        console.log(returnString);
});
