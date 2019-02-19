function Gaensebluemchen(name, vis_options, estimation_method)
{
	/*
		Parameters
		*/
		this.nr_items = 101;
	// log spaced volume scaling factor
	// this.global_v = local_linspace(0.01, 150, this.nr_items);
	this.global_v = local_linspace_2(1, 0.5, this.nr_items);
	// scaling factor space
	this.y_axis = local_logspace(2, 8, this.nr_items);
	// this.y_axis = local_linspace(1, 20000, this.nr_items);
	// name of the div
	this.plot_name = name;
	//
	this.options = vis_options;
	//
	this.estimation_method = estimation_method;
	//
	var ref = this;

	this.xScale = d3.scale.linear()
	.domain([ref.global_v[0], ref.global_v[ref.global_v.length - 1]])
	.range([0, ref.global_v.length * ref.options.itemSize]);

	this.xAxis = d3.svg.axis()
	.scale(ref.xScale)
		// .ticks(6, function(d) { return 10 + formatPower(Math.round(Math.log(d) / Math.LN10)); })
		.orient("bottom");

		this.yScale = d3.scale.log()
		.domain([ref.y_axis[0], ref.y_axis[ref.y_axis.length - 1]])
		.range([ref.y_axis.length * ref.options.itemSize, 0]);

		this.yAxis = d3.svg.axis()
		.scale(ref.yScale)
		.ticks(6, function(d) { return 10 + formatPower(Math.round(Math.log(d) / Math.LN10)); })
		.orient("left");

		this.explanation = "Tradeoff between volume and total number of physical qubits. Vertical lines are changes in distance.";
		create_description(this.plot_name.replace(".", ""), this.explanation);

		this.parameters = {};
	// this.parameters["scaling_factor"] = 50;

	this.parameters["scaling_factor"] = experiment.routing_overhead;

	this.parameters["distance"] = 15;

	this.parameters["bool_distance"] = experiment.bool_distance;
	// this.parameters["bool_distance"] = false;
	
	this.parameters["bool_add_bus_qubits"] = true;

	this.parameters["___phys_err_rate"] = 0;
	this.parameters["___default_phys_err_rate"] = phys_error_rate;
	//52 bit integers
	this.parameters["___min_y"] = Number.MAX_SAFE_INTEGER;
	this.parameters["___max_y"] = Number.MIN_SAFE_INTEGER;
	//
	//click detector
	this.parameters["___just_clicked"] = true;
	//
	this.reset_min_max_y();

	for(key in this.parameters)
	{
		create_parameter(this.plot_name.replace(".", ""), key, this.parameters[key]);
	}
}

Gaensebluemchen.prototype.gen_data = function(total_failure_rate, volume_min, space_min, p_err)
{
	var factor = (100 + this.parameters["scaling_factor"])/100;
	
	var data = new Array(); // stores the line plot for no physical qubits
	var dist_changes = new Array(); // stores the volume factors for which the distance changes
	
	var dist_last = -1;
	var volume_param = 0;
	var ret = 0;

	// var add_worst_case_bus_qubits = true;
	var add_worst_case_bus_qubits = this.parameters["bool_add_bus_qubits"];

	for (var i=0; i<this.global_v.length; i++)
	{
		volume_param = approx_mult_factor(volume_min, this.global_v[i]);

		//maybe change names for this data array because different meaning of output
		ret = calculate_total(this.estimation_method, volume_param, space_min, total_failure_rate, p_err);
		
		if (dist_last != -1 && dist_last != ret.dist){
			dist_changes.push({
				x: this.global_v[i],
				new_dist: ret.dist
			})
		}
		
		dist_last = ret.dist;

		var to_save_nr_qubits = ret.number_of_physical_qubits;
		var use_data_bus = false;
		/*
			adaptation begin
			*/
		//Eliminate the ancillas means multiply by 1/factor
		var space_2 = approx_mult_factor(space_min,  (1/factor));
		var volume_2 = approx_mult_factor(volume_param,  (1/factor));
		var ret_vol_2 = calculate_total(this.estimation_method, volume_2, space_2, total_failure_rate, p_err);

		/*
			Increase distance to lower res with data bus
			*/
			var iterations = 0;                        
			var increased_distance = ret_vol_2.dist;
			var qubits_inc_dist = number_of_physical_qubits(increased_distance, space_2);
			if(add_worst_case_bus_qubits)
			{
				qubits_inc_dist += worst_case_number_of_bus_qubits(increased_distance, space_2);
			}

			var last_p_logical = -1;
			var curr_p_logical = -1;

			while((qubits_inc_dist <= ret.number_of_physical_qubits) && !use_data_bus)
			{
				iterations++;

				var volume_inc_distance = volume_2 * increased_distance;
			// space_min is not number of patches, but number of logical qubits, and the data bus counts as a qubit
			var ret_3 = calculate_total(this.estimation_method, volume_inc_distance, space_min, total_failure_rate, p_err);
			// var ret_3 = calculate_total(this.estimation_method, volume_inc_distance, space_2, total_failure_rate, p_err);

			if(ret_3.dist <= increased_distance)
			{
				/*this number was calculated for the full layout without data bus*/
				to_save_nr_qubits = qubits_inc_dist;
				use_data_bus = true;
			}
			else
			{   
				last_p_logical = 1 / (austin_p_logical(p_err, increased_distance)  * volume_inc_distance);
				increased_distance += 2;
				curr_p_logical = 1 / (austin_p_logical(p_err, increased_distance)  * volume_inc_distance);

				qubits_inc_dist = number_of_physical_qubits(increased_distance, space_2);
				if(add_worst_case_bus_qubits)
				{
					qubits_inc_dist += worst_case_number_of_bus_qubits(increased_distance, space_2);
				}
			}
		}

		var increase_percentage = qubits_inc_dist / ret.number_of_physical_qubits;
		console.log("----");
		if(this.global_v[i] == 1.0)
		{
			console.log("THE IMPORTANT PART at scaling " + this.global_v[i] + " with err rate " + phys_error_rate);

			console.log("increased by: " + increase_percentage + " compared to original distance " + ret.dist + "\n");
			console.log("last_p_log: " + last_p_logical + " curr_p_log: " + curr_p_logical);

			console.log("use " + use_data_bus + " it:" + iterations + " from:" + ret_vol_2.dist + " to:" + increased_distance + " from:" + ret.number_of_physical_qubits + " to:" + qubits_inc_dist)
		}
		
	   /*
			-------------
			*/

			data.push({
				x: this.global_v[i],
				number_of_physical_qubits: to_save_nr_qubits,
				original_number_of_physical_qubits: ret.number_of_physical_qubits,
				dist: ret.dist,
				use_data_bus: use_data_bus
			})
		}

		var ret ={
			data : data,
			dist_changes : dist_changes
		}

		return ret;
	}

	Gaensebluemchen.prototype.draw_vertical_line = function(y_min, y_max, x_pos, type="vertical_line")
	{
		var ref = this;
		var data = [{x: x_pos, y: y_min}, {x: x_pos, y: y_max}]
		var line = d3.svg.line()
		.x(function(d,i) {
			return ref.xScale(d.x);})
		.y(function(d,i) {
			return ref.yScale(d.y);});

		d3.select("#plotsvg" + ref.plot_name.replace(".", "")).append("svg:path").attr("class", type).attr("d", line(data));
	}

// 
Gaensebluemchen.prototype.draw_line_plot = function(data)
{
	var slices = new Array(new Array());
	var slice_index = 0;

	for(var i=0; i<data.length; i++)
	{
		if(data[i].use_data_bus)
		{
			if(slices[slice_index].length == 0)
			{
				slices[slice_index].push(i);
			}
		}
		else
		{
			if(slices[slice_index].length == 1)
			{
				slices[slice_index].push(i);

				slice_index++;
				slices[slice_index] = new Array();
			}
		}
	}
	if(slices[slice_index].length == 0)
	{
		//an unfinished slice means that only false for use_data_bus to the end of the data
		slices.pop();
	}
	else if(slices[slice_index].length == 1)
	{
		// until the end there are only use_data_bus elements
		slices[slice_index].push(data.length);
	}

	var ref = this;
	var line1 = d3.svg.line()
	.x(function(d, i) {
		return ref.xScale(d.x);})
	.y(function(d, i) {
			// return d.use_data_bus ? ref.yScale(d.number_of_physical_qubits) : 0;});
			// return (d.use_data_bus ? ref.yScale(d.number_of_physical_qubits) : ref.yScale(ref.y_axis[0]));});
			return ref.yScale(d.number_of_physical_qubits);});

	var line2 = d3.svg.line()
	.x(function(d, i) {
		return ref.xScale(d.x);})
	.y(function(d, i) {
		return ref.yScale(d.original_number_of_physical_qubits);});

	for(var slice_index = 0; slice_index < slices.length; slice_index++)
	{
		console.log("use data bus between indices: " + slices[slice_index]);
		var data_slice = data.slice(slices[slice_index][0], slices[slice_index][1]);

		//the lines with data bus advantage
		d3.select("#plotsvg" + ref.plot_name.replace(".", "")).append("svg:path").attr("class", "line_plot").attr("d", line1(data_slice));
	}

	// the line without data bus
	d3.select("#plotsvg" + ref.plot_name.replace(".", "")).append("svg:path").attr("class", "line_plot_red").attr("d", line2(data));
	// d3.select("#plotsvg" + ref.plot_name.replace(".", "")).append("svg:path").attr("class","line_plot").attr("d", line1(data));
}


Gaensebluemchen.prototype.init_visualisation = function()
{
	var ref = this;

	var svg = d3.select(this.plot_name)
	.append("svg")
	.attr("width", ref.options.width + ref.options.margin.left + ref.options.margin.right)
	.attr("height", ref.options.height + ref.options.margin.top + ref.options.margin.bottom)
		//.on('mouseover', cleanMouseOver.bind(ref) )
		.append("g")
		.attr("id", "plotsvg" + ref.plot_name.replace(".", ""))
		.attr("transform", "translate(" + ref.options.margin.left + "," + ref.options.margin.top + ")");

		this.update_data();

		svg.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate(0, " + (ref.options.cellSize/2) + ")")
		.call(ref.yAxis)
		.selectAll('text')
		.attr('font-weight', 'normal');

		svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(" + (ref.options.cellSize/2) + ", " + (ref.global_v.length + 1) * ref.options.itemSize + ")")
		.call(ref.xAxis)
		.selectAll('text')
		.attr('font-weight', 'normal')
		.style("text-anchor", "start");

	// now add titles to the axes
	var movey = (this.y_axis.length + 1) * this.options.itemSize;
	var movex = (this.global_v.length + 1) * this.options.itemSize;

	svg.append("text")
		.attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
		.attr("transform", "translate("+ (-ref.options.margin.left/2) +","+(movex/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
		.text("Total qubits");

		svg.append("text")
		.attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
		.attr("transform", "translate("+ (movex/2) +","+(movey + (ref.options.margin.bottom / 2))+")")  // centre below axis
		.text("Volume Factor");

    /*
	// add mouseover events
	var mouseG = svg.append("g").attr("class", "mouse-over-effects");
	

	var tooltip = svg.append("g")
		.attr("id", "tooltip");
		
	var tooltip_text_1 = tooltip.append("text")
		.attr("id", "tooltip_text")
		.attr("transform", "translate(10,-10)")
		.style("opacity","0");;


	var tooltip_circle = tooltip.append("circle")
		.attr("r", 5)
		.style("visibility","visible")
		.style("stroke", "black")
		.style("fill", "none")
		.style("stroke-width", "1px")
		.style("opacity","0");;



	mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
	  .attr('width', ref.options.width) // can't catch mouse events on a g element
	  .attr('height', ref.options.height)
	  .attr('fill', 'none')
	  .attr('pointer-events', 'all')
	  .on('mouseout', function() { tooltip_text.style("opacity", "0");
			tooltip_circle.style("opacity", "0");})
	  .on('mouseover', function() { tooltip_text.style("opacity", ".8");
			tooltip_circle.style("opacity", ".8");})
	  .on('mousemove', function() { // mouse moving over canvas
	  	var mouse = d3.mouse(this);
			
			d3.select("#tooltip")
				.attr("transform", function(d, i) {
					 x_val = ref.xScale.invert(mouse[0]);

					 line_plot = d3.select(".line_plot").node();
					 line_plot_red = d3.select(".line_plot_red").node();
           var get_y = function(line_plot){
	           var beginning = 0;
	           end = line_plot.getTotalLength();
	           target = null;

	           while (true){
	            target = Math.floor((beginning + end) / 2);
	            pos = line_plot.getPointAtLength(target);
	            if ((target === end || target === beginning) && pos.x !== mouse[0]) {
	              break;
	            }
	            if (pos.x > mouse[0])      end = target;
	            else if (pos.x < mouse[0]) beginning = target;
	            else break; //position found
	           }
           	return pos;
         		};
          
         	pos_data = get_y(line_plot);
         	pos_red = get_y(line_plot_red);

          tooltip_text.text("Anc " + Math.round(ref.yScale.invert(pos_red.y))
          	+" databus: " + Math.round(ref.yScale.invert(pos_data.y)));
          
					return "translate(" + mouse[0] + "," + pos_data.y +")";

			});
		});*/
	}

	Gaensebluemchen.prototype.collect_parameters = function()
	{
	/*
		Collect from the parameter fields in the HTML
		*/
		for(key in this.parameters)
		{
			if(!is_internal_parameter(key))
			{
				this.parameters[key] = read_parameter(this.plot_name.replace(".", ""), key);
			}
		}

		if(this.parameters["bool_distance"] == true)
		{
		//if the distance should be enforced
		//it means that the phys_error_rate has to be adapted such that the enforced distance is resulting
		//
		//save the default value from the experiment
		// this.parameters["__default_phys_err_rate"] = phys_error_rate;

		//in "a18" the safety factor is 99
		if(this.parameters["___just_clicked"] == false)
		{
			this.parameters["___default_phys_err_rate"] = phys_error_rate;
		}
		
		phys_error_rate = austin_p_err(this.parameters["distance"], 1/(99 * volume_min));

		this.parameters["___just_clicked"] = true;
	}
	else
	{
		//restore the phys error rate that was initially set for the experiment
		if (this.parameters["___just_clicked"] == true)
		{
			phys_error_rate = this.parameters["___default_phys_err_rate"];
		}

		// reset click detector
		this.parameters["___just_clicked"] = false;
	}
}

Gaensebluemchen.prototype.update_data = function()
{
	this.collect_parameters();

	var out = this.gen_data(total_failure_rate, volume_min, space_min, phys_error_rate);

	d3.select(this.plot_name).selectAll(".line_plot").remove();
	d3.select(this.plot_name).selectAll(".line_plot_red").remove();
	d3.select(this.plot_name).selectAll(".vertical_line").remove();

	this.update_y_axis(out.data);

	for (var i = out.dist_changes.length - 1; i >= 0; i--)
	{
		this.draw_vertical_line(this.y_axis[this.y_axis.length - 1], this.y_axis[0], out.dist_changes[i].x)
	}

	var mdpos = Math.floor(this.global_v.length/2);
	this.draw_vertical_line(this.y_axis[this.y_axis.length - 1], this.y_axis[0], this.global_v[mdpos], "no_scale_point");

	this.draw_line_plot(out.data);
}

Gaensebluemchen.prototype.reset_min_max_y = function()
{
	this.parameters["___min_y"] = Number.MAX_SAFE_INTEGER;
	this.parameters["___max_y"] = Number.MIN_SAFE_INTEGER;
}

Gaensebluemchen.prototype.store_min_max_y = function(y_val)
{
	this.parameters["___min_y"] = Math.min(y_val, this.parameters["___min_y"]);
	this.parameters["___max_y"] = Math.max(y_val, this.parameters["___max_y"]);
}

Gaensebluemchen.prototype.update_y_axis = function(data)
{
	var ref = this;
	// 
	this.reset_min_max_y();
	for (var i=0; i<data.length; i++)
	{
		this.store_min_max_y(data[i].number_of_physical_qubits);
		this.store_min_max_y(data[i].original_number_of_physical_qubits);
	}
	//
	//recompute the values on the axis
	var min_log = Math.floor(Math.log10(this.parameters["___min_y"]));
	var max_log = Math.ceil(Math.log10(this.parameters["___max_y"]));
	if(max_log == min_log)
	{
		max_log++;
	}
	this.y_axis = local_logspace(min_log, max_log, this.nr_items);

	this.yScale = d3.scale.log()
	.domain([ref.y_axis[0], ref.y_axis[ref.y_axis.length - 1]])
	.range([ref.y_axis.length * ref.options.itemSize, 0]);

	this.yAxis = d3.svg.axis()
	.scale(ref.yScale)
		.ticks(6, function(d) { return d.toString()[0] + "·10" + formatPower(Math.floor(Math.log10(d))); })
		.orient("left");
	//
	//delete the y axis
	d3.select("#plotsvg" + ref.plot_name.replace(".", "")).selectAll(".y.axis").remove();
	//
	//append the new one
	d3.select("#plotsvg" + ref.plot_name.replace(".", "")).append("g")
	.attr("class", "y axis")
	.attr("transform", "translate(0, " + (ref.options.cellSize/2) + ")")
	.call(ref.yAxis)
	.selectAll('text')
	.attr('font-weight', 'normal');
}