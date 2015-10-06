/* Main entry point: Reads js file and generates AST */
function readFile() {


	/* A hash map of metadata for each variable in program */
	var metadataList = {};

	/* A stack of temp metadataList to handle expressions which create loops in CFG */
	var tempMetadataListStack = [];

	/* A stack of flags that determines flow is in a block */
	/* 0: in if, 1: in else, 2: in for, 3: in while */
	/* TODO: avoid using magic numbers */
	/* TODO: there should be no need different numbers for "for" and "while";
	         three numbers will be enough, "if", "else" and "other loops". */
	var isInBlockStack = [];

	/* A hash map includes function name x function body pairs */
	var functionMap = {};

	/* Main traverse method */
	function traverse(object, checker) {
		
		if (utility.isArray(object)) {
			for (var i = 0; i < object.length; i++) {
				if (utility.isDefinedAndNotNull(object[i])) {
					traverse(object[i], checker);
				}
			}
			return;
		}
		
	    checker.call(null, object);
	}

	/* Main check method: 'traverse' calls this for the nodes it traverses,
	/* This method registers visitors to the node */
	function checkNode(node) {
		
		/* Add accept function to nodes for visitor pattern */
		node.accept = function(visitor) {
			visitor.visit(node);
		};
		
		node.accept(new ProgramChecker());
		node.accept(new BlockStatementChecker());
		node.accept(new ExpressionStatementChecker());
		node.accept(new ArrayExpressionChecker());
		node.accept(new ObjectExpressionChecker());
		node.accept(new BinaryExpressionChecker());
		node.accept(new UpdateExpressionChecker());
		node.accept(new LogicalExpressionChecker());
		node.accept(new AssignmentExpressionChecker());
		node.accept(new PropertyChecker());
		
		node.accept(new VariableDeclarationChecker());
		node.accept(new ModelVariableDeclarationChecker());
		
		node.accept(new FunctionCallChecker());
		node.accept(new ModelFunctionCallChecker());
		
		node.accept(new IfStatementChecker());
		node.accept(new ForStatementChecker());
		node.accept(new ForInStatementChecker());
		node.accept(new WhileStatementChecker());
		node.accept(new ReturnStatementChecker());
	}

	/* A metadata includes variable name, a flag determines model variable, and the CFG of the variable */
	function createNewMetadata(varName, isModelVar) {
		var metadata = {};
		metadata.name = varName;
		metadata.isModelVar = isModelVar;
		metadata.cfg = null;
		metadata.lastNode = null;
		return metadata;
	}

	/* gets the metadata of the variable from map, if not exists creates new */
	function getMetadataOfVariable(varName, isModelVar) {
		if (utility.isUndefinedOrNull(metadataList[varName])) {
			metadataList[varName] = createNewMetadata(varName, isModelVar);
		}
		return metadataList[varName];
	}

	/* gets the tempMetadata of the variable from map, if not exists creates new */
	function getTempMetadataOfVariable(isInBlockFlag, varName, isModelVar) {
		var tempMetadataList = utility.getLast(tempMetadataListStack);
		if (utility.isUndefinedOrNull(tempMetadataList[varName])) {
			tempMetadataList[varName] = createNewMetadata(varName, isModelVar);
			
			// it is in consequent or alternate of an if block
			if (isInBlockFlag === 0 || isInBlockFlag === 1) {
				tempMetadataList[varName].cfg = [null, null];  
				tempMetadataList[varName].lastNode = [null, null];
			}
		}
		return tempMetadataList[varName];
	}

	/* adds a new empty node to CFG of the metadata of the variable */
	function addEmptyNodeToCFGOfVariable(varName, isModelVar) {
		var metadata = getMetadataOfVariable(varName, isModelVar);
		var cfg = {type: "EMPTY", node: null, next: null};
		
		addNewCFGToMetadata(metadata, cfg);
	}

	/* adds new node to CFG of the metadata of the variable */
	function addNewNodeToCFGOfVariable(varName, isModelVar, node, type) {
		if (utility.isUndefined(varName)) return;
		
		var metadata = getMetadataOfVariable(varName, isModelVar);
		//var cfg = {type: type, node: node, next: null}; //TODO: temporary
		var cfg = {type: type, node: {}, next: null};
		
		addNewCFGToMetadata(metadata, cfg);
	}

	function addNewCFGToMetadata(metadata, cfg) {
		// flow is in a loop block or much deeper
		if (utility.isNotEmpty(isInBlockStack)) {
			var isInBlockFlag = utility.getLast(isInBlockStack);
			metadata = getTempMetadataOfVariable(isInBlockFlag, metadata.name, metadata.isModelVar);
			
			if (isInBlockFlag === 0 || isInBlockFlag === 1) {
				addNewCFGToTempMetadataForIfStatement(isInBlockFlag, metadata, cfg);
				return;
			}
		}
		
		if (utility.isUndefinedOrNull(metadata.lastNode)) {
			metadata.cfg = cfg;
			metadata.lastNode = cfg;
		} else {
			metadata.lastNode.next = cfg;
			metadata.lastNode = cfg;
		}
	}

	/* adds new node to left or right CFG of the metadata of the variable */
	function addNewCFGToTempMetadataForIfStatement(isInBlockFlag, metadata, cfg) {
		if (utility.isUndefinedOrNull(metadata.lastNode[isInBlockFlag])) {
			metadata.cfg[isInBlockFlag] = cfg;
			metadata.lastNode[isInBlockFlag] = cfg;
		} else {
			metadata.lastNode[isInBlockFlag].next = cfg;
			metadata.lastNode[isInBlockFlag] = cfg;
		}	
	}

	//* Helper Functions of Checkers *//
	//--------------------------------//
	function addFunctionDefinitionToFunctionMap(name, body) {
		functionMap[name] = body;
	}

	function checkFunctionDeclaration(varName, node) {
		if (node.type === 'FunctionExpression') {
			addFunctionDefinitionToFunctionMap(varName, node.body);
		}
	}

	function checkFunctionModelVariable(expression) {
		if (expression.right.type === 'FunctionExpression') {
			addFunctionDefinitionToFunctionMap(expression.left.property.name, expression.right);
		}
	}

	function isObjectControllerScope(object) {
		return object.name === '$scope';
	}

	function report(node, problem) {
		console.log('Line ', node.loc.start.line, ': ', problem);
	}

	function transferAndClearTempMetadaList() {
		var tempMetadaList = tempMetadataListStack.pop();
		for (var varName in tempMetadaList) {
	        if (tempMetadaList.hasOwnProperty(varName)) {
				var tempMetadata = tempMetadaList[varName];
				
				addEmptyNodeToCFGOfVariable(varName, tempMetadata.isModelVar);
				
				/* realMetadata can be the real one or one level higher tempMetadata */
				var realMetadata = getMetadataOfVariable(varName, tempMetadata.isModelVar);
				var isInBlockFlag = -1;
				if (utility.isNotEmpty(isInBlockStack)) {
					realMetadata = getTempMetadataOfVariable(isInBlockStack.length - 1, varName, tempMetadata.isModelVar);
					
					isInBlockFlag = utility.getLast(isInBlockStack);
				}
				
				var lastNodeOfRealMetadata = realMetadata.lastNode;
				/* realMetadata is a temp metadata for an if block */
				if (isInBlockFlag === 0 || isInBlockFlag === 1) {
					lastNodeOfRealMetadata = realMetadata.lastNode[isInBlockFlag];
				}
				
				/* tempMetadata is an if block */
				if (utility.isArray(tempMetadata.cfg)) {
					lastNodeOfRealMetadata.left = tempMetadata.cfg[0];
					lastNodeOfRealMetadata.right = tempMetadata.cfg[1];
					lastNodeOfRealMetadata.next = tempMetadata.cfg[0];
					
					var newLastNodeOfRealMetadata = {type: "EMPTY", node: null, next: null};
					
					lastNodeOfRealMetadata.left.next = newLastNodeOfRealMetadata;
					if (utility.isDefinedAndNotNull(lastNodeOfRealMetadata.right)) {
						lastNodeOfRealMetadata.right.next = newLastNodeOfRealMetadata;
					} else {
						lastNodeOfRealMetadata.right = newLastNodeOfRealMetadata;
					}
					
					if (isInBlockFlag === 0 || isInBlockFlag === 1) {
						realMetadata.lastNode[isInBlockFlag] = newLastNodeOfRealMetadata;
					} else {
						realMetadata.lastNode = newLastNodeOfRealMetadata;
					}
				} 
				/* tempMetadata is loop block (for, while) */
				else {
					lastNodeOfRealMetadata.right = tempMetadata.cfg
					tempMetadata.lastNode.next = lastNodeOfRealMetadata;

					var emptyNode = {type: "EMPTY", node: null, next: null};
					
					lastNodeOfRealMetadata.left = emptyNode;
					lastNodeOfRealMetadata.next = emptyNode;
					lastNodeOfRealMetadata = emptyNode;
				}	
	        }
	    }
	}
	//--------end of helpers----------//


	//*   Checkers AKA Visitors   *//
	//--------------------------------//
	var ProgramChecker = function() {
	
		this.visit = function(node) {
		
			if (node.type === 'Program') {
				traverse(node.body, checkNode);
			}
		}
		
	}
	
	var BlockStatementChecker = function() {
	
		this.visit = function(node) {
		
			if (node.type === 'BlockStatement') {
				traverse(node.body, checkNode);
			}
		}
		
	}
	
	var ExpressionStatementChecker = function() {
	
		this.visit = function(node) {
			
			if (node.type === 'ExpressionStatement') {
				addNewNodeToCFGOfVariable(node.expression.name, false, node, 'USE');
			}
		}
		
	}
	
	var ArrayExpressionChecker = function() {
	
		this.visit = function(node) {
			
			if (node.type === 'ArrayExpression') {
				traverse(node.elements, checkNode);
			}
		}
		
	}
	
	var ObjectExpressionChecker = function() {
	
		this.visit = function(node) {
			
			if (node.type === 'ObjectExpression') {
				traverse(node.properties, checkNode);
			}
		}
		
	}
	
	var PropertyChecker = function() {
	
		this.visit = function(node) {
			
			if (node.type === 'Property') {
				var usageType = (node.kind === 'init' || node.kind === 'set') ? 'DEF' : 'USE';
				addNewNodeToCFGOfVariable(node.key.name, false, node.value, usageType);
			}
		}
		
	}
	
	var BinaryExpressionChecker = function() {
	
		this.visit = function(node) {
			
			if (node.type === 'BinaryExpression') {
				traverse(node.left, checkNode);
				traverse(node.right, checkNode);
			}
		}
		
	}
	
	var UpdateExpressionChecker = function() {
	
		this.visit = function(node) {
			
			if (node.type === 'UpdateExpression') {
				traverse(node.argument, checkNode);
			}
		}
		
	}
	
	var LogicalExpressionChecker = function() {
	
		this.visit = function(node) {
			
			if (node.type === 'LogicalExpression') {
				traverse(node.left, checkNode);
				traverse(node.right, checkNode);
			}
		}
		
	}
	
	var AssignmentExpressionChecker = function() {

		this.visit = function(node) {
		
			if (node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression') {
				addNewNodeToCFGOfVariable(node.expression.left.name, false, node.expression.right, 'DEF');
				if (utility.isDefinedAndNotNull(node.expression.right)) {
					traverse(node.expression.right, checkNode);
				}
			}
		}
		
	}
	
	var VariableDeclarationChecker = function() {

		this.visit = function(node) {
		
			if (node.type === 'VariableDeclaration') {
				var declarations = node.declarations;
				for (var i = 0; i < declarations.length; i++) {
					var declarator = declarations[i];
					
					addNewNodeToCFGOfVariable(declarator.id.name, false, declarator.init, 'DEF');
			
					if (utility.isDefinedAndNotNull(declarator.init)) {
						traverse(declarator.init, checkNode);
					}

					checkFunctionDeclaration(declarator.id.name, declarator.init);
				}
			}
		}
		
	}

	var ModelVariableDeclarationChecker = function() {

		this.visit = function(node) {
		
			if (node.type === 'ExpressionStatement' && 
				node.expression.type === 'AssignmentExpression' && 
				node.expression.left.type === 'MemberExpression') {
				
				var leftSide = node.expression.left;
				var rightSide = node.expression.right;
				if (isObjectControllerScope(leftSide.object)) {
					addNewNodeToCFGOfVariable(leftSide.property.name, true, rightSide, 'DEF');
					
					checkFunctionDeclaration(leftSide.property.name, rightSide);
				}
			}
		}
		
	}

	var FunctionCallChecker = function() {

		this.visit = function(node) {
		
			if (node.type === 'ExpressionStatement' &&
				node.expression.type === 'CallExpression' &&
				node.expression.callee.type === 'Identifier') {
				
				var callee = node.expression.callee;
				var funcDefinition = functionMap[callee.name];
				
				// no need to report, just add a use to cfg.
				if (utility.isUndefinedOrNull(funcDefinition)) { 
					report(node, 'Usage of undefined function.');
				} 	
				addNewNodeToCFGOfVariable(callee.name, false, node.expression, 'USE');
				
				traverse(funcDefinition.body, checkNode);
			}
		}
		
	}

	var ModelFunctionCallChecker = function() {

		this.visit = function(node) {
			
			if (node.type === 'ExpressionStatement' &&
				node.expression.type === 'CallExpression' &&
				node.expression.callee.type === 'MemberExpression') {
				
				var callee = node.expression.callee;
				var funcDefinition = functionMap[callee.property.name];
				
				// no need to report, just add a use to cfg.
				if (utility.isUndefinedOrNull(funcDefinition)) { 
					report(node, 'Usage of undefined function.');
				}
				
				if (isObjectControllerScope(callee.object)) {
					addNewNodeToCFGOfVariable(callee.property.name, true, node.expression, 'USE');
				}
				
				traverse(funcDefinition.body, checkNode);
			}
		}
		
	}

	var IfStatementChecker = function() {

		this.visit = function(node) {
			
			if (node.type === 'IfStatement') {
			
				var leftSide = node.test.left;
				var rightSide = node.test.right;
				
				addNewNodeToCFGOfVariable(leftSide.name, false, node.test, 'USE');
				addNewNodeToCFGOfVariable(rightSide.name, false, node.test, 'USE');
				
				var newTempMetadataList = {};
				tempMetadataListStack.push(newTempMetadataList);
				isInBlockStack.push(0);

				traverse(node.consequent.body, checkNode);
				if (utility.isDefinedAndNotNull(node.alternate)) {
					isInBlockStack[isInBlockStack.length - 1] = 1;
					traverse(node.alternate.body, checkNode);
				}
				isInBlockStack.pop();
				
				transferAndClearTempMetadaList();
			}
		}
		
	}

	var ForStatementChecker = function() {

		this.visit = function(node) {
			
			if (node.type === 'ForStatement') {
				traverse(node.init, checkNode);
				traverse(node.test, checkNode);
				traverse(node.update, checkNode);
				
				var newTempMetadataList = {};
				tempMetadataListStack.push(newTempMetadataList);
				isInBlockStack.push(2);

				traverse(node.body, checkNode);
				
				isInBlockStack.pop();
				transferAndClearTempMetadaList();
			}
		}
		
	}
	
	var ForInStatementChecker = function() {

		this.visit = function(node) {
			
			if (node.type === 'ForInStatement') {
				traverse(node.left, checkNode);
				traverse(node.right, checkNode);
				
				var newTempMetadataList = {};
				tempMetadataListStack.push(newTempMetadataList);
				isInBlockStack.push(2);

				traverse(node.body, checkNode);
				
				isInBlockStack.pop();
				transferAndClearTempMetadaList();
			}
		}
		
	}
	
	var WhileStatementChecker = function() {

		this.visit = function(node) {
			
			if (node.type === 'WhileStatement') {
				traverse(node.test, checkNode);
				
				var newTempMetadataList = {};
				tempMetadataListStack.push(newTempMetadataList);
				isInBlockStack.push(3);

				traverse(node.body, checkNode);
				
				isInBlockStack.pop();
				transferAndClearTempMetadaList();
			}
		}
		
	}
	
	var ReturnStatementChecker = function() {
	
		this.visit = function(node) {
		
			if (node.type === 'ReturnStatement') {
				if (utility.isDefinedAndNotNull(node.argument)) {
					traverse(node.argument, checkNode);
				}
			}
		}
		
	}
	//---------end of checkers------------//
	

	var fileContent = utility.getElementById('editor').value;
	try {
		var syntaxTree = esprima.parse(fileContent, { tolerant: true, loc: true, sourceType: 'script' });
		traverse(syntaxTree.body, checkNode);
	} catch (e) {
		console.log('Could not read the file!' + e);
	}
	
	utility.getElementById('tokens').value = JSON.stringify(metadataList, null, 3);
	
}

readFile();
utility.getElementById('editor').onblur = function () { readFile(); };

