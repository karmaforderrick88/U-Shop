import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

function ask(question){
    return new Promise(resolve => rl.question(question,resolve))
}

async function compare(){

    const str1 = (await ask('String 1: ')).trim()
    const str2 = (await ask('String 2: ')).trim()
    const match = null

    if(typeof str1 != 'string' || typeof str2 != 'string'){
        console.log('Please enter strings')
        process.exit(1)
    }
    
    switch(match){
        case str1 === str2:
            match = true
            break;
        
            case str1 != str2:
            match = false
            break
    }
 if(match){
    console.log('Strings match')
    process.exit(0)
 }
 else{
    console.log('Strings mismatch')
    process.exit(0)
 }

}
compare()