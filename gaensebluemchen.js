function Gaensebluemchen(name, vis_options, estimation_method)
{
    /*
        Parameters
    */
    this.nr_items = 100;
    // log spaced volume scaling factor
    this.global_v = local_linspace(0.01, 100, this.nr_items);
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
}

Gaensebluemchen.prototype.gen_data = function(total_failure_rate, volume_min, space_min, p_err)
{
    var data = new Array(); // stores the line plot for no physical qubits
    var dist_changes = new Array(); // stores the volume factors for which the distance changes
    
    var dist_last = -1;
    var volume_param = 0;
    var ret = 0;

    for (var i=0; i<this.global_v.length; i++)
    {
        volume_param = volume_min * this.global_v[i];
        //maybe change names for this data array because different meaning of output
        ret = calculate_total(this.estimation_method, volume_param, space_min, total_failure_rate, p_err);
        
        if (dist_last != -1 && dist_last != ret.dist){
            dist_changes.push({
                x: this.global_v[i],
                new_dist: ret.dist
            })
        }
        
        dist_last = ret.dist;
        
        data.push({
            x: this.global_v[i],
            number_of_physical_qubits: ret.number_of_physical_qubits,
            dist: ret.dist
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
    var line = d3.svg.line()
        .x(function(d,i) {
            return ref.xScale(d.x);})
        .y(function(d,i) {
            return ref.yScale(d.number_of_physical_qubits);});

    d3.select("#plotsvg" + ref.plot_name.replace(".", "")).append("svg:path").attr("class","line_plot").attr("d", line(data));
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

Gaensebluemchen.prototype.update_data = function()
{
    var out = this.gen_data(total_failure_rate, volume_min, space_min, phys_error_rate);

    d3.select(this.plot_name).selectAll(".line_plot").remove();
    d3.select(this.plot_name).selectAll(".vertical_line").remove();

    for (var i = out.dist_changes.length - 1; i >= 0; i--)
    {
        this.draw_vertical_line(this.y_axis[this.y_axis.length - 1], this.y_axis[0], out.dist_changes[i].x)
    }

    this.draw_line_plot(out.data);
}