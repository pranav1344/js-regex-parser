const operatorPrecedence = {
    '|': 0,
    '.': 1,
    '?': 2,
    '*': 2,
    '+': 2
};

function peek(stack) {
    return stack.length && stack[stack.length - 1];
}

const insertExplicitConcatOperator =  function(exp) {
    let output = '';
    for (let i = 0; i < exp.length; i++) {
        const token = exp[i];
        output += token;
        if (token === '(' || token === '|') {
            continue;
        }
        if (i < exp.length - 1) {
            const lookahead = exp[i + 1];
            if (lookahead === '*' || lookahead === '?' || lookahead === '+' || lookahead === '|' || lookahead === ')') {
                continue;
            }
            output += '.';
        }
    }
    return output;
};

const toPostfix = function(exp) {
    let output = '';
    const operatorStack = [];
    for (const token of exp) {
        if (token === '.' || token === '|' || token === '*' || token === '?' || token === '+') {
            while (operatorStack.length && peek(operatorStack) !== '('
                && operatorPrecedence[peek(operatorStack)] >= operatorPrecedence[token]) {
                output += operatorStack.pop();
            }
            operatorStack.push(token);
        } else if (token === '(' || token === ')') {
            if (token === '(') {
                operatorStack.push(token);
            } else {
                while (peek(operatorStack) !== '(') {
                    output += operatorStack.pop();
                }
                operatorStack.pop();
            }
        } else {
            output += token;
        }
    }

    while (operatorStack.length) {
        output += operatorStack.pop();
    }
    return output;
};



function createNFAState(isEnd) {
    return {
        isEnd,
        transition: {
            epsilonTransitions: []
        }
    };
}

function createNFA(symbol = null) {
    const start = createNFAState(false);
    const end = createNFAState(true);
    addTransition(start, end, symbol);
    
    return { start, end };
}

function addTransition(from, to, symbol = null) {
    if(!symbol) {
        from.transition.epsilonTransitions.push(to);
    } else {
        from.transition[symbol] = to;
    }
}
function addNextState(state, nextStates, visited) {
    if (state.transition.epsilonTransitions.length) {
        for (const st of state.transition.epsilonTransitions) {
            if (!visited.find(vs => vs === st)) {
                visited.push(st);
                addNextState(st, nextStates, visited);
            }
        }
    } else {
        nextStates.push(state);
    }
}

function concat(first, second) {
    addTransition(first.end, second.start);
    first.end.isEnd = false;

    return { start: first.start, end: second.end };
}

function union(first, second) {
    const start = createNFAState(false);
    addTransition(start, first.start);
    addTransition(start, second.start);

    const end = createState(true);
    addTransition(first.end, end);
    first.end.isEnd = false;
    addTransition(second.end, end);
    second.end.isEnd = false;

    return { start, end };
}

function closure(nfa) {
    const start = createNFAState(false);
    const end = createNFAState(true);

    addTransition(start, end);
    addTransition(start, nfa.start);

    addTransition(nfa.end, end);
    addTransition(nfa.end, nfa.start);
    nfa.end.isEnd = false;

    return { start, end };
}


function toNFA(postfixExp) {
	if(postfixExp === '') {
	    return createNFA();
	}
	
	const stack = [];
    
	for (const token of postfixExp) {
		if(token === '*') {
   		    stack.push(closure(stack.pop()));
   		} else if (token === '|') {
   		    const right = stack.pop();
   		    const left = stack.pop();
   		    stack.push(union(left, right));
   		} else if (token === '.') {
   		    const right = stack.pop();
   		    const left = stack.pop();
   		    stack.push(concat(left, right));
   		} else {
   		    stack.push(createNFA(token));
   		}
   	}
    
	return stack.pop();
}



function search(nfa, word) {
    let currentStates = [];
    addNextState(nfa.start, currentStates, []);

    for (const symbol of word) {
        const nextStates = [];

        for (const state of currentStates) {
            const nextState = state.transition[symbol];
            if (nextState) {
                addNextState(nextState, nextStates, []);
            }
        }
        currentStates = nextStates;
    }

    return currentStates.find(s => s.isEnd) ? true : false;
}

const isRegexMatch = function(expression, word) {
    console.log(insertExplicitConcatOperator(expression));
    const postfixExp = toPostfix(insertExplicitConcatOperator(expression));
    const nfa = toNFA(postfixExp);
    //console.log(nfa);
    console.log(postfixExp);
    return search(nfa, word);
}


console.log(isRegexMatch('a*bb', 'abb'));