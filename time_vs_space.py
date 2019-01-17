import math
import numpy as np

#plotting
from bokeh.plotting import figure, save, output_file

def logical_error_probability(d, p):
    # 8 steps per error correction cycle
    p *= 8
    # use equation from fowlers paper on logical error rate
    tmp = d*math.factorial(d) / (math.factorial(int((d+1)/2) - 1)
        * math.factorial(int((d+1)/2)))
    return tmp * p**int(d+1)/2


def calc_distance(p_err_out, p_phys, spacetime_volume,
    min_dist = 3, max_dist = 50):
    """
    Find the lowest distance for which the error rate of the whole circuit
    is given by less than p_err_out. Given a physical error rate of p_phys.  
    """
    for d in range(min_dist, max_dist):
        if(p_err_out > 1 - (1-logical_error_probability(d,p_phys))**spacetime_volume):
            return d
    raise RuntimeError("Could not find a suitable distance")

def logical_error_from_volume(volume, total_failure_rate):
    return total_failure_rate**(1./volume)


def number_of_physical_qubits(distance, space):
    # only looking at data qubits
    return space*distance*distance

def calculate_total(volume, space, total_failure_rate, p_err = 0.03):
    P_1 = logical_error_from_volume(volume, total_failure_rate)
    dist = calc_distance(total_failure_rate, p_err, volume)
    return dist, number_of_physical_qubits(dist, space)



def main():
    # parameters:
    total_failure_rate = 0.01
    # data for time optimized
    volume_min = 10000
    space_min = 10

    # generate parameter space for scaling factors
    v = np.linspace(1, 1000,100) # scaling factor volume
    s = np.linspace(1,10,100) # scaling factor space

    #dist1, physicalqubits1 = calculate_total(volume1, space1, total_failure_rate)
    data = np.zeros((len(v),len(s)))
    #print("Format: (volume_factor, space_factor, total_qubits_time_optimized - total_qubits_space_optimized)")
    for i in range(len(v)):
        for j in range(len(s)):
            dist1, physicalqubits1 = calculate_total(volume_min, int(space_min*s[j]+0.5), total_failure_rate)
            dist2, physicalqubits2 = calculate_total(int(volume_min*v[i]+0.5), space_min, total_failure_rate)
            data[i,j] = physicalqubits1 - physicalqubits2
            #print((v_,s_,dist1 ,dist2,physicalqubits1,physicalqubits2))
    plot_data(v,s,data)
    return



def RGB_map(data):
    # data < 0 -> time optimized is better than space optimized
    if data <= 0:
        return 255,255,255
    else: # gray area space optimized is better
        return 100,100,100


def plot_data(v,s,data):
    img = np.empty((len(v),len(s)), dtype=np.uint32)
    view = img.view(dtype=np.uint8).reshape((len(v), len(s), 4))

    # i is vertical coordinate
    # j is horizontal coordinate
    for i in range(len(v)):
        for j in range(len(s)):
            # RED, GREEN, BLUE
            view[i, j, 0], view[i, j, 1], view[i, j, 2] = RGB_map(data[i,j]);
            view[i, j, 3] = 255 # ALPHA

    p = figure(x_range=(s[0],s[-1]), y_range=(v[0],v[-1]))
    p.image_rgba(image=[img], x=s[0], y=v[0], dw=s[-1]-s[0], dh=v[-1]-v[0])
    output_file("image_rgba.html", title="image_rgba.py example")
    save(p)
    return



if __name__ == '__main__':
    main()