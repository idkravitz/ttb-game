/**
 * Inheritance plugin
 *
 * Copyright (c) 2009 Filatov Dmitry (alpha@zforms.ru)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

jQuery.inherit = function() {

	var
		hasBase = typeof(arguments[0]) == 'function',
		base = hasBase? arguments[0] : function() {},
		override = arguments[hasBase? 1 : 0],
		statical = arguments[hasBase? 2 : 1],
		result = function() {
			if(this.__constructor) {
				this.__constructor.apply(this, arguments);
			}
		},
		inheritance = function() {}
		;

	jQuery.extend(result, base, statical);

	inheritance.prototype = base.prototype;

	result.prototype = new inheritance();
	result.prototype.constructor = result;
	result.prototype.__self = result;

	if(override) {
		var _override = [];
		jQuery.each(override, function(i) {
			_override.push(i);
		});
		for(var i in override) {
			if(override.hasOwnProperty(i)) {
				_override.push(i);
			}
		}
		// fucking ie hasn't toString in for
		if(override.toString && jQuery.inArray('toString', _override) == -1) {
			_override.push('toString');
		}
		jQuery.each(_override, function() {
			if(hasBase && typeof(base.prototype[this]) == 'function' &&
				typeof(result.prototype[this]) == 'function') {
				(function(methodName) {
					result.prototype[methodName] = function() {
						var __baseSaved = this.__base;
						this.__base = base.prototype[methodName];
						var result = override[methodName].apply(this, arguments);
						this.__base = __baseSaved;
						return result;
					};
				})(this);
			}
			else {
				result.prototype[this] = override[this];
			}
		});
	}

	return result;

};
