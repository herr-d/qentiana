function Maigloeckchen(name, vis_options, estimation_method)
{
    /*
        Parameters
    */
    this.nr_items = 100;
    // log spaced volume scaling factor
    this.global_v = local_logspace(-2, 5, this.nr_items);
    // scaling factor space
    this.global_s = local_linspace(0, 2, this.nr_items);
    //name of the div
    this.plot_name = name;
    //
    this.options = vis_options;
    //
    this.estimation_method = estimation_method;
    //
    var ref = this;

    this.xScale_local = d3.scale.linear()
        .domain([ref.global_s[0], ref.global_s[ref.global_s.length - 1]])
        .range([0, ref.global_s.length * ref.options.itemSize]);

    this.xAxis = d3.svg.axis()
        .scale(ref.xScale_local)
        .orient("bottom");

    this.yScale_local = d3.scale.log()
        .domain([ref.global_v[0], ref.global_v[ref.global_v.length-1]])
        .range([ref.global_v.length * ref.options.itemSize, 0]);

    this.yAxis = d3.svg.axis()
        .scale(ref.yScale_local)
        .ticks(6, function(d) { return 10 + formatPower(Math.round(Math.log(d) / Math.LN10)); })
        .orient("left");

    this.explanation = "The initial circuit is at position (1,1) and any optimization will change the volume and space factor. The final position will show how much resource savings can be expected. Darker colors are better.";
    create_description(this.plot_name.replace(".", ""), this.explanation);
}

Maigloeckchen.prototype.init_visualisation = function()
{
    /*
        D3
    */
    var ref = this;
    // console.log(ref);
    var svg = d3.select(ref.plot_name)
        .append("svg")
        .attr("width", ref.options.width + ref.options.margin.left + ref.options.margin.right)
        .attr("height", ref.options.height + ref.options.margin.top + ref.options.margin.bottom)
        .append("g")
        .attr("id", "plotsvg" + ref.plot_name.replace(".", ""))
        .attr("transform", "translate(" + ref.options.margin.left + "," + ref.options.margin.top + ")");

    // var data = plot_generators[plot_name](total_failure_rate, volume_min, space_min, phys_error_rate);
    var data = this.gen_data(total_failure_rate, volume_min, space_min, phys_error_rate);

    d3.select('#plotsvg' + ref.plot_name.replace(".", "")).selectAll('rect')
        .data(data)
        .enter().append('g').append('rect')
        .attr('class', 'cell')
        .attr('width', ref.options.cellSize)
        .attr('height', ref.options.cellSize)
        .attr('y', function(d) { return ref.yScale_local(d.y); })
        .attr('x', function(d) { return ref.xScale_local(d.x); })
        .attr('fill', function(d) {return ref.color_interpretation(d);})
        .on('mouseover', handleMouseOver.bind(ref) );

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


    // draw lines
    // xarray1 = local_linspace(0.01, 2, this.nr_items)
    // var line1 = d3.svg.line()
    // .x(function(d,i) {
    //     return ref.xScale_local(d);})
    // .y(function(d,i) {
    //     return ref.yScale_local(1/(Math.pow(d,3.5)));});

    xarray2 = [0.01,100]
    var line2 = d3.svg.line()
    .x(function(d,i) {
        return ref.xScale_local(1);})
    .y(function(d,i) {
        return ref.yScale_local(d);});

    xarray3 = [0.01,2]
    var line3 = d3.svg.line()
    .x(function(d,i) {
        return ref.xScale_local(d);})
    .y(function(d,i) {
        return ref.yScale_local(1);});

    // svg.append("svg:path").attr("d", line1(xarray1));
    svg.append("svg:path").attr("d", line2(xarray2));
    svg.append("svg:path").attr("d", line3(xarray3));

    // now add titles to the axes
    var movey = (ref.global_v.length + 1) * ref.options.itemSize;
    var movex = (ref.global_s.length + 1) * ref.options.itemSize;

    svg.append("text")
        .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("transform", "translate("+ (-ref.options.margin.left/2) +","+(movex/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
        .text("Volume Factor");

    svg.append("text")
        .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("transform", "translate("+ (movex/2) +","+(movey + (ref.options.margin.bottom / 2))+")")  // centre below axis
        .text("Space Factor");
}

Maigloeckchen.prototype.gen_data = function(total_failure_rate, start_volume, start_space, p_err)
{
    // 2D Array
    var data = new Array();

    var ret_1 = calculate_total(this.estimation_method, start_volume, start_space, total_failure_rate, p_err);

    for (var i=0; i<this.global_v.length; i++)
    {
        for(var j=0; j < this.global_s.length; j++)
        {
            var space_param = approx_mult_factor(this.global_s[j], start_space);
            var vol_param = approx_mult_factor(this.global_v[i], start_volume);
            var ret_2 = calculate_total(this.estimation_method, vol_param, space_param, total_failure_rate, p_err);

            if ((ret_1 == "ERROR") || (ret_2 == "ERROR"))
            {
                console.log("SOMETHING WENT WRONG!!!");
            }

            var ratio = (ret_2["number_of_physical_qubits"])/ (ret_1["number_of_physical_qubits"]);

            data.push({
                x: this.global_s[j],
                y: this.global_v[i],
                dist_opt_vol : ret_1.dist,
                dist_opt_space : ret_2.dist,
                nr_target_vol : ret_1["number_of_physical_qubits"],
                nr_target_space : ret_2["number_of_physical_qubits"],
                ratio: ratio
            })
        }
    }

    return data;
}

Maigloeckchen.prototype.color_interpretation = function(d)
{
    return "rgb(" + to_rgb(d.ratio) + "," + to_rgb(d.ratio) + "," + to_rgb(d.ratio) + ")";
}