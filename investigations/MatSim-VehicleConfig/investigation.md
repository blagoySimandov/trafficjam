# Vehicle Configuration in MATSim

## How Vehicle Definition Works

MATSim uses a vehicles file that defines vehicle types and then assigns those types to specific vehicles. The system is hierarchical, you define a vehicle type with its characteristics once, then can reference that type for individual vehicles.

## Basic Structure

The vehicles file looks like this:

xml

```
<vehicleDefinitions>
    <!-- Define vehicle types -->
    <vehicleType id="car">
        <capacity>
            <seats persons="4"/>
            <standingRoom persons="0"/>
        </capacity>
        <length meter="7.5"/>
        <width meter="1.0"/>
        <maximumVelocity meterPerSecond="40.0"/>
        <passengerCarEquivalents pce="1.0"/>
    </vehicleType>
    
    <vehicleType id="bus">
        <capacity>
            <seats persons="50"/>
            <standingRoom persons="30"/>
        </capacity>
        <length meter="18.0"/>
        <width meter="2.5"/>
        <maximumVelocity meterPerSecond="20.0"/>
        <passengerCarEquivalents pce="3.0"/>
    </vehicleType>
    
    <!-- Assign types to actual vehicles -->
    <vehicle id="person_1_car" type="car"/>
    <vehicle id="bus_line_1_veh_1" type="bus"/>
</vehicleDefinitions>
```

## Key Parameters You Can Change

### 1\. Capacity

Controls how many people can fit in the vehicle:

xml

```
<capacity>
    <seats persons="50"/>           <!-- Seated capacity -->
    <standingRoom persons="30"/>    <!-- Standing capacity -->
</capacity>
```

Total capacity = seats + standingRoom. This matters for:

* Public transport simulation (buses/trains can get full)
* Passenger boarding/alighting
* When vehicles reject passengers due to capacity

For private cars, capacity usually does not matter unless you are doing ridesharing simulations.

### 2\. Passenger Car Equivalents (PCU)

This is critical for flow capacity calculations:

xml

```
<passengerCarEquivalents pce="1.0"/>  <!-- Standard car -->
<passengerCarEquivalents pce="2.0"/>  <!-- Large truck -->
<passengerCarEquivalents pce="0.25"/> <!-- Bicycle -->
```

PCU affects how much road capacity a vehicle consumes. A bus with pce=3.0 takes up three times as much capacity as a car with pce=1.0 when passing through a link.

Important for:

* Mixed traffic simulation (cars, trucks, bikes on same network)
* Realistic congestion modeling
* Sample population runs (see below)

### 3\. Maximum Velocity

xml

```
<maximumVelocity meterPerSecond="16.67"/>  <!-- 60 km/h -->
```

This caps the vehicle speed even if the link allows higher speeds. Useful for:

* Bicycles (slower than cars)
* Heavy vehicles (speed limiters)
* Delivery vehicles
* Different car types

The actual speed used is the minimum of:

* Link free speed
* Vehicle maximum velocity

### 4\. Other Parameters

xml

```
<length meter="7.5"/>   <!-- Vehicle length, affects following distances -->
<width meter="1.0"/>    <!-- Vehicle width -->
```

These are less commonly used but available for detailed simulation.

## How to Configure in Your Scenario

### Method 1: External Vehicles File

Create a separate vehicles file and reference it in config i think this is the best method for us:

xml

```
<module name="vehicles">
    <param name="vehiclesFile" value="vehicles.xml"/>
</module>
```

### Method 2: Mode-Specific Vehicle Types

For simpler scenarios, define vehicle types per mode without explicit vehicle IDs:

xml

```
<module name="qsim">
    <param name="vehiclesSource" value="modeVehicleTypesFromVehiclesData"/>
</module>
```

Then in your vehicles file, just define types matching your mode names:

xml

```
<vehicleType id="car">
    <maximumVelocity meterPerSecond="40.0"/>
    <passengerCarEquivalents pce="1.0"/>
</vehicleType>

<vehicleType id="bike">
    <maximumVelocity meterPerSecond="4.17"/>   <!-- 15 km/h -->
    <passengerCarEquivalents pce="0.25"/>
</vehicleType>
```

MATSim will automatically assign these vehicle types to agents using those modes.

## Critical Information for Sample Populations

If you run a 10% sample scenario, you need to adjust PCU values accordingly because we might have thresholds set for certain vehicle capacities. Two approaches:

### Approach 1: Adjust Flow/Storage Capacity Factors

xml

```
<module name="qsim">
    <param name="flowCapacityFactor" value="0.1"/>
    <param name="storageCapacityFactor" value="0.1"/>
</module>
```

This scales down the network capacity to match your sample size. Keep vehicle PCU at normal values.

### Approach 2: Adjust Vehicle PCU

If you want to run public transport at 100% (all buses) but population at 10%, you need to reduce bus PCU:

xml

```
<vehicleType id="bus">
    <passengerCarEquivalents pce="0.3"/>  <!-- Instead of 3.0 -->
    <!-- Rest stays normal -->
</vehicleType>
```

See section 13.6 for more details on this issue. There is also a config parameter to help:

xml

```
<module name="qsim">
    <param name="pcuThresholdForFlowCapacityEasing" value="0.5"/>
</module>
```

This tells MATSim that vehicles with PCU below 0.5 do not need to wait for capacity accumulation, which helps prevent spurious delays for scaled-down transit vehicles.

## Vehicle Source Configuration

Tell MATSim where to get vehicle information:

xml

```
<module name="qsim">
    <!-- Option 1: Use explicit vehicle IDs from vehicles file -->
    <param name="vehiclesSource" value="fromVehiclesData"/>
    
    <!-- Option 2: Generate mode vehicles automatically -->
    <param name="vehiclesSource" value="modeVehicleTypesFromVehiclesData"/>
    
    <!-- Option 3: Use default vehicle for everything -->
    <param name="vehiclesSource" value="defaultVehicle"/>
</module>
```

For most use cases, option 2 (modeVehicleTypesFromVehiclesData) is the best choice. It automatically creates vehicles for each person based on their mode, using the vehicle types you defined.

## Example using external file referencing

For a typical city planning scenario with cars, bikes, and buses:

xml

```
<vehicleDefinitions>
    <vehicleType id="car">
        <capacity>
            <seats persons="4"/>
        </capacity>
        <maximumVelocity meterPerSecond="27.78"/>  <!-- 100 km/h -->
        <passengerCarEquivalents pce="1.0"/>
    </vehicleType>
    
    <vehicleType id="bike">
        <capacity>
            <seats persons="1"/>
        </capacity>
        <maximumVelocity meterPerSecond="4.17"/>   <!-- 15 km/h -->
        <passengerCarEquivalents pce="0.25"/>
    </vehicleType>
    
    <vehicleType id="bus">
        <capacity>
            <seats persons="70"/>
            <standingRoom persons="50"/>
        </capacity>
        <maximumVelocity meterPerSecond="13.89"/>  <!-- 50 km/h -->
        <passengerCarEquivalents pce="3.0"/>
    </vehicleType>
</vehicleDefinitions>
```

Then in config:

xml

```
<module name="vehicles">
    <param name="vehiclesFile" value="vehicles.xml"/>
</module>

<module name="qsim">
    <param name="vehiclesSource" value="modeVehicleTypesFromVehiclesData"/>
    <param name="mainMode" value="car,bike"/>  <!-- Which modes use the network -->
</module>
```

This gives usheterogeneous traffic with realistic speeds and capacity consumption. Bikes will be slower and take less capacity than cars, and buses will be slower and take more capacity.
