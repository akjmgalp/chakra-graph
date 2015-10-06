function create_utility() {

	var utility = {};

	/////* --- OBJECT UTILS --- */////
	
	/**
	 * Returns true if obj is object.
	 * @param obj
	 * @returns {boolean}
	 */
	utility.isObject = function (obj) {
		return utility.isDefinedAndNotNull(obj) && typeof obj === 'object';
	};

	/**
	 * Returns true if obj is string.
	 * @param obj
	 * @returns {boolean}
	 */
	utility.isString = function (obj) {
		return utility.isDefinedAndNotNull(obj) && typeof obj === 'string';
	};

	/**
	 * Returns true if obj is number.
	 * @param obj
	 * @returns {boolean}
	 */
	utility.isNumber = function (obj) {
		return utility.isDefinedAndNotNull(obj) && typeof obj === 'number';
	};

	/**
	 * Returns true if obj is not a number.
	 * @param obj
	 * @returns {boolean}
	 */
	utility.isNaN = function (obj) {
		return utility.isDefinedAndNotNull(obj) && isNaN(obj);
	};

	/**
	 * Returns true if obj is boolean.
	 * @param obj
	 * @returns {boolean}
	 */
	utility.isBoolean = function (obj) {
		return utility.isDefinedAndNotNull(obj) && typeof obj === 'boolean';
	};

	/**
	 * Returns true if obj is function.
	 * @param obj
	 * @returns {boolean}
	 */
	utility.isFunction = function (obj) {
		return utility.isDefinedAndNotNull(obj) && typeof obj === 'function';
	};

	/**
	 * Returns true if obj is array.
	 * @param obj
	 * @returns {boolean}
	 */
	utility.isArray = function (obj) {
		return utility.isDefinedAndNotNull(obj) && Object.prototype.toString.call(obj) === '[object Array]';
	};

	/**
	 * Returns true if obj is file list.
	 * @param obj
	 * @returns {boolean}
	 */
	utility.isFileList = function (obj) {
		return utility.isDefinedAndNotNull(obj) && Object.prototype.toString.call(obj) === '[object FileList]';
	};

	/**
	 * Returns true if obj is date.
	 * @param obj
	 * @returns {boolean}
	 */
	utility.isDate = function (obj) {
		return utility.isDefinedAndNotNull(obj) && Object.prototype.toString.call(obj) === '[object Date]';
	};

	/**
	 * Returns true if obj is null.
	 * @param obj
	 * @returns {boolean}
	 */
	utility.isNull = function (obj) {
		return obj === null || obj === 'null';
	};

	/**
	 * Returns false if obj is null.
	 * @param obj
	 * @returns {boolean}
	 */
	utility.isNotNull = function (obj) {
		return obj !== null && obj !== 'null';
	};

	/**
	 * Returns true if obj is undefined.
	 * @param obj
	 * @returns {boolean}
	 */
	utility.isUndefined = function (obj) {
		return typeof obj === 'undefined';
	};

	/**
	 * Returns false if obj is undefined.
	 * @param obj
	 * @returns {boolean}
	 */
	utility.isDefined = function (obj) {
		return typeof obj !== 'undefined';
	};

	/**
	 * Returns true if obj is defined and not null.
	 * @param obj
	 * @returns {boolean}
	 */
	utility.isDefinedAndNotNull = function (obj) {
		return utility.isDefined(obj) && utility.isNotNull(obj);
	};

	/**
	 * Returns true if obj is undefined or null.
	 * @param obj
	 * @returns {boolean}
	 */
	utility.isUndefinedOrNull = function (obj) {
		return utility.isUndefined(obj) || utility.isNull(obj);
	};

	/**
	 * Returns true if obj is defined and not null and not empty string.
	 * @param obj
	 * @returns {boolean}
	 */
	utility.isDefinedAndNotNullAndNotEmptyString = function (obj) {
		return utility.isDefinedAndNotNull(obj) && '' !== obj;
	};

	/**
	 * Returns true if obj is undefined or null or empty string.
	 * @param obj
	 * @returns {boolean}
	 */
	utility.isUndefinedOrNullOrEmptyString = function (obj) {
		return utility.isUndefinedOrNull(obj) || '' === obj;
	};
	
	/////* --- ARRAY UTILS --- */////
	
	/**
	 * Returns true if arr has no item.
	 * @param arr
	 * @returns {boolean}
	 */
	utility.isEmpty = function (arr) {
		return 0 === arr.length;
	};

	/**
	 * Returns true if arr has at least 1 item.
	 * @param arr
	 * @returns {boolean}
	 */
	utility.isNotEmpty = function (arr) {
		return 0 < arr.length;
	};

	/**
	 * Returns true if arr contains item, wrt comparator function.
	 * @param arr
	 * @param item
	 * @param comparator (defaults to angular.equals)
	 * @returns {boolean}
	 */
	utility.contains = function (arr, item, comparator) {
		if (objectUtil.isUndefined(comparator)) {
			comparator = angular.equals;
		}
		for (var i = 0; i < arr.length; i++) {
			if (comparator(arr[i], item)) {
				return true;
			}
		}

		return false;
	};

	/**
	 * Returns true if arr1 includes any item in arr2.
	 * @param arr1
	 * @param arr2
	 * @returns {boolean}
	 */
	utility.containsAny = function (arr1, arr2) {
		for (var i = 0; i < arr2.length; i++) {
			if (utility.contains(arr1, arr2[i], undefined)) {
				return true;
			}
		}

		return false;
	};

	/**
	 * Returns true if arr1 includes all items in arr2.
	 * @param arr1
	 * @param arr2
	 * @returns {boolean}
	 */
	utility.containsAll = function (arr1, arr2) {
		for (var i = 0; i < arr2.length; i++) {
			if (!utility.contains(arr1, arr2[i], undefined)) {
				return false;
			}
		}

		return true;
	};

	/**
	 * Returns true if arr contains item.
	 * @param arr
	 * @param entity
	 * @returns {boolean}
	 */
	utility.containsEntity = function (arr, entity) {
		return utility.contains(arr, entity, comparisonUtil.compareById);
	};

	/**
	 * Adds item to first index of arr.
	 * @param arr
	 * @param item
	 * @returns {void}
	 */
	utility.pushFirst = function (arr, item) {
		arr.splice(0, 0, item);
	};

	/**
	 * Adds all items from arr1 to arr2.
	 * @param arr1
	 * @param arr2
	 * @returns {void}
	 */
	utility.pushAll = function (arr1, arr2) {
		for (var i = 0; i < arr1.length; i++) {
			arr2.push(arr1[i]);
		}
	};

	/**
	 * Copies arr to a new array (shallow copy)
	 * @param arr
	 * @returns {Array}
	 */
	utility.copy = function (arr) {
		var newArr = [];
		for (var i = 0; i < arr.length; i++) {
			newArr.push(arr[i]);
		}
		return newArr;
	};

	/**
	 * Removes item from arr.
	 * @param arr
	 * @param item
	 * @param comparator (defaults to angular.equals)
	 * @returns {void}
	 */
	utility.removeItem = function (arr, item, comparator) {
		if (objectUtil.isUndefined(comparator)) {
			comparator = angular.equals;
		}
		var index = utility.indexOf(arr, item, comparator);
		if (index !== -1) {
			arr.splice(index, 1);
		}
	};

	/**
	 * Removes all items from arr.
	 * @param arr
	 * @returns {void}
	 */
	utility.removeAll = function (arr) {
		while (utility.isNotEmpty(arr)) {
			arr.pop();
		}
	};

	/**
	 * Finds index of item in arr. Returns -1 if not found.
	 * @param arr
	 * @param item
	 * @param comparator (defaults to angular.equals)
	 * @returns {int}
	 */
	utility.indexOf = function (arr, item, comparator) {
		if (objectUtil.isUndefined(comparator)) {
			comparator = angular.equals;
		}

		for (var i = 0; i < arr.length; i++) {
			if (comparator(arr[i], item)) {
				return i;
			}
		}

		return -1;
	};

	/**
	 * Extracts list of property from objectList.
	 * @param arr
	 * @param property
	 * @returns {Array}
	 */
	utility.extractListOfProperty = function (arr, property) {
		var result = [];
		for (var i = 0; i < arr.length; i++) {
			result.push(reflectionUtil.getProperty(arr[i], property));
		}

		return result;
	};

	/**
	 * Filter arr with the given filter function. Return new filtered array
	 * @param arr
	 * @param filterFunction
	 * @returns {Array}
	 */
	utility.filter = function (arr, filterFunction) {
		if (objectUtil.isDefined(filterFunction)) {
			return arr.filter(filterFunction);
		}
	};

	/**
	 * Returns last element of arr
	 * @param arr
	 * @returns {*}
	 */
	utility.getLast = function (arr) {
		return arr[arr.length - 1];
	};

	/**
	 * Returns string of elements of arr
	 * @param arr
	 * @param property
	 * @param seperator
	 * @returns {string}
	 */
	utility.toString = function (arr, property, seperator) {
		if (objectUtil.isUndefined(seperator)) {
			seperator = ', ';
		}

		var result = '';
		for (var i = 0; i < arr.length; i++) {
			if (objectUtil.isDefinedAndNotNull(property)) {
				result += reflectionUtil.getProperty(arr[i], property);
			} else {
				result += arr[i];
			}

			if(i !== arr.length-1) {
				result += seperator;
			}
		}

		return result;
	};

	/**
	 * Sorts the arr with given comparator.
	 * @param arr
	 * @param comparator (defaults to angular.equals)
	 * @returns {void}
	 */
	utility.sort = function (arr, comparator) {
		if (objectUtil.isDefined(comparator)) {
			arr.sort(comparator);
		} else {
			arr.sort();
		}
	};
	
	/////* --- JQUERY UTILS --- */////
	
	/**
	 * Returns dom element by id
	 * @param id
	 * @returns {object}
	 */
	utility.getElementById = function (id) {
		return document.getElementById(id);
	};

	return utility;

};

window.utility = create_utility();