function Gaensebluemchen(name, vis_options, estimation_method)
{
    /*
        Parameters
    */
    this.nr_items = 100;
    // log spaced volume scaling factor
    // this.global_v = local_linspace(0.01, 150, this.nr_items);
    this.global_v = local_linspace(1, 1000, this.nr_items);
    // scaling factor space
    this.y_axis = local_logspace(1, 5, this.nr_items);
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
    this.parameters["scaling_factor"] = 1.5;
    for(key in this.parameters)
    {
        create_parameter(this.plot_name.replace(".", ""), key, this.parameters[key]);
    }
}

Gaensebluemchen.prototype.gen_data = function(total_failure_rate, volume_min, space_min, p_err)
{
    this.collect_parameters();
    var factor = this.parameters["scaling_factor"];
    
    var data = new Array(); // stores the line plot for no physical qubits
    var dist_changes = new Array(); // stores the volume factors for which the distance changes
    
    var dist_last = -1;
    var volume_param = 0;
    var ret = 0;

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
        //Removing ancillas means that a linear scalig of the volume took place
        var volume_2 = approx_mult_factor(volume_param,  (1/factor));
        //
        var ret_vol_2 = calculate_total(this.estimation_method, volume_2, space_2, total_failure_rate, p_err);

        /*
            We are using ret_vol_2.dist as factor, because:
            - the total volume without ancilla dictates the distance (for fixed/same error rate)
            - the data bus is actually where one would merge and split patches, therefore those qubits do not increase the distance with or without data bus

            We are NOT using ret_vol2.dist as factor, and prefer ret.dist (original), because:
            - more pessimistic approach
            - assume that the data bus has a negative influence?
        */
        var volume_3 = approx_mult_factor(volume_2, ret_vol_2.dist);//multiply because of data bus
        var space_3 = space_2;//because time was scaled due to data bus
        var ret_vol_3 = calculate_total(this.estimation_method, volume_3, space_3, total_failure_rate, p_err);

        // if(ret_vol_3.dist <= ret_vol_2.dist)
        // if(ret_vol_3.dist <= ret.dist)
        if((ret_vol_3.number_of_physical_qubits < ret.number_of_physical_qubits) && (ret_vol_3.dist <= ret_vol_2.dist))
        {
            to_save_nr_qubits = ret_vol_3.number_of_physical_qubits;
            use_data_bus = true;
        }
        /*
            adaptation end
        */

        /*
            Increase distance to lower res with data bus
        */
        if(use_data_bus == false)
        {
            var increased_distance = ret.dist + 2;
            var qubits_inc_dist = number_of_physical_qubits(increased_distance, space_2);
            
            var volume_inc_distance = volume_2 * increased_distance;
            var ret_4 = calculate_total(this.estimation_method, volume_inc_distance, space_2, total_failure_rate, p_err);
                        
            if(qubits_inc_dist < ret.number_of_physical_qubits)
            {
                if(ret_4.dist <= increased_distance)
                {
                    /*this number was calculated for the full layout without data bus*/
                    to_save_nr_qubits = qubits_inc_dist;
                    use_data_bus = true;
                }
            }
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

// needs access to D3 functionality mainly the svg to plot in and x/yScale
Gaensebluemchen.prototype.draw_vertical_line = function(y_min, y_max, x_pos)
{
    var ref = this;
    var data = [{x: xpos, y: y_min}, {x: x_pos, y: y_max}]
    var line = d3.svg.line()
        .x(function(d,i) {
            return ref.xScale(d.x);})
        .y(function(d,i) {
           return ref.yScale(d.y);});

    d3.select("#plotsvg" + ref.plot_name.replace(".", "")).append("svg:path").attr("d", line(data));
}

Gaensebluemchen.prototype.draw_vertical_line = function(y_min, y_max, x_pos)
{
    var ref = this;
    var data = [{x: x_pos, y: y_min}, {x: x_pos, y: y_max}]
    var line = d3.svg.line()
        .x(function(d,i) {
            return ref.xScale(d.x);})
        .y(function(d,i) {
           return ref.yScale(d.y);});

    d3.select("#plotsvg" + ref.plot_name.replace(".", "")).append("svg:path").attr("class","vertical_line").attr("d", line(data));
}

// needs access to 
Gaensebluemchen.prototype.draw_line_plot = function(data)
{
    var ref = this;
    var line1 = d3.svg.line()
        .x(function(d, i) {
            return ref.xScale(d.x);})
        .y(function(d, i) {
            // return d.use_data_bus ? ref.yScale(d.number_of_physical_qubits) : 0;});
            return (d.use_data_bus ? ref.yScale(d.number_of_physical_qubits) : ref.yScale(ref.y_axis[0]));});

    var line2 = d3.svg.line()
        .x(function(d, i) {
            return ref.xScale(d.x);})
        .y(function(d, i) {
            // return d.use_data_bus ? ref.yScale(d.number_of_physical_qubits) : 0;});
            return ref.yScale(d.original_number_of_physical_qubits);});

    d3.select("#plotsvg" + ref.plot_name.replace(".", "")).append("svg:path").attr("class","line_plot").attr("d", line1(data));
    d3.select("#plotsvg" + ref.plot_name.replace(".", "")).append("svg:path").attr("class","line_plot_red").attr("d", line2(data));
}

Gaensebluemchen.prototype.init_visualisation = function()
{
    var ref = this;

    var svg = d3.select(this.plot_name)
        .append("svg")
        .attr("width", ref.options.width + ref.options.margin.left + ref.options.margin.right)
        .attr("height", ref.options.height + ref.options.margin.top + ref.options.margin.bottom)
        .on('mouseover', cleanMouseOver.bind(ref) )
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
}

Gaensebluemchen.prototype.collect_parameters = function()
{
     /*
        Collect from the field
    */
   for(key in this.parameters)
   {
       this.parameters[key] = document.getElementById(this.plot_name.replace(".", "") + "_" + key).value;
   }
}

Gaensebluemchen.prototype.update_data = function()
{
    var out = this.gen_data(total_failure_rate, volume_min, space_min, phys_error_rate);

    d3.select(this.plot_name).selectAll(".line_plot").remove();
    d3.select(this.plot_name).selectAll(".line_plot_red").remove();
    d3.select(this.plot_name).selectAll(".vertical_line").remove();

    for (var i = out.dist_changes.length - 1; i >= 0; i--)
    {
        this.draw_vertical_line(this.y_axis[this.y_axis.length - 1], this.y_axis[0], out.dist_changes[i].x)
    }

    this.draw_line_plot(out.data);
}