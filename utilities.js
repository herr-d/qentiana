/*
Utility functions
*/
function local_logspace(start, stop, num=50)
{
    //assume base = 10
    var ret = new Array(num);
    
    var delta = (stop - start)/num;
    for(var i=0; i<num; i++)
    {
        ret[i] = Math.pow(10, start + delta * i);
    }
    
    return ret;
}

function local_linspace(start, stop, num=50)
{
    var ret = new Array(num);
    
    var delta = (stop - start)/num;
    for(var i=0; i<num; i++)
    {
        ret[i] = start + delta * i;
    }
    
    return ret;
}

function create_2d_array(dim1, dim2)
{
    var ret = new Array(dim1);
    for(var i=0; i<dim1; i++)
    {
        ret[i] = new Array(dim2);
    }
    return ret;
}

var local_factorial_cache = {};
function local_factorial (n)
{
    if (n == 0 || n == 1)
    {
        return 1;
    }
    if (local_factorial_cache[n+""] > 0)
    {
        return local_factorial_cache[n+""];
    }
    
    var part = 1;
    for(var fn = 2; fn <=n; fn++)
    {
        if (local_factorial_cache[fn+""] > 0)
        {
            part = local_factorial_cache[fn+""];
        }
        else
        {
            part = part * fn;
            local_factorial_cache[fn+""] = part;
        }
    } 
    local_factorial_cache[n+""] = part;
    
    return local_factorial_cache[n+""];
}

// precompute values in cache
local_factorial(100);

function to_rgb(param)
{
    var ret = (param > 1 ? 255 : Math.round(param * 255));
    return ret;
}

function from_rgb(param)
{
    var ret = (param == 255 ? 2 : param / 255);
    return ret;
}