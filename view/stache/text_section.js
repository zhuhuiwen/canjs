steal("can/util", "can/view/live","./utils.js", "./live_attr.js", function(can, live, utils, liveStache) {
	live = live || can.view.live;
	
	var TextSectionBuilder = function(){
		this.stack = [new TextSection()];
	};
	
	can.extend(TextSectionBuilder.prototype,utils.mixins);
	
	can.extend(TextSectionBuilder.prototype,{
		// Adds a subsection.
		startSection: function(process){
			var subSection = new TextSection();
			this.last().add({process: process, truthy: subSection});
			this.stack.push(subSection);
		},
		endSection: function(){
			this.stack.pop();
		},
		inverse: function(){
			this.stack.pop();
			var falseySection = new TextSection();
			this.last().last().falsey = falseySection;
			this.stack.push(falseySection);
		},
		compile: function(state){
			
			var renderer = this.stack[0].compile();
			
			return function(scope, options){
				
				var compute = can.compute(function(){
					return renderer(scope, options);
				}, null, false);
				
				compute.computeInstance.bind("change", can.k);
				var value = compute();
				if( compute.computeInstance.hasDependencies ) {
					if(state.attr) {
						live.simpleAttribute(this, state.attr, compute);
					} else {
						liveStache.attributes(this, compute, scope, options);
					}
					compute.computeInstance.unbind("change", can.k);
				} else {
					if(state.attr) {
						can.attr.set(this, state.attr, value);
					} else {
						live.setAttributes(this, value);
					}
				}
			};
		}
	});
	
	var passTruthyFalsey = function(process, truthy, falsey){
		return function(scope, options){
			return process.call(this, scope, options, truthy, falsey);
		};
	};
	
	var TextSection = function(){
		this.values = [];
	};
	
	can.extend( TextSection.prototype, {
		add: function(data){
			this.values.push(data);
		},
		last: function(){
			return this.values[this.values.length - 1];
		},
		compile: function(){
			var values = this.values,
				len = values.length;
				
			for(var i = 0 ; i < len; i++) {
				var value = this.values[i];
				if(typeof value === "object") {
					values[i] = passTruthyFalsey( value.process,
					    value.truthy && value.truthy.compile(),
					    value.falsey && value.falsey.compile());
				}
			}
			
			return function(scope, options){
				var txt = "",
					value;
				for(var i = 0; i < len; i++){
					value = values[i];
					txt += typeof value === "string" ? value : value.call(this, scope, options);
				}
				return txt;
			};
		}
	});
	
	return TextSectionBuilder;
});
