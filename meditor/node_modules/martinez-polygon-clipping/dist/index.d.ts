export declare function diff(subject: Geometry, clipping: Geometry): Geometry | null;

export declare type Geometry = Polygon | MultiPolygon;

export declare function intersection(subject: Geometry, clipping: Geometry): Geometry | null;

export declare type MultiPolygon = Polygon[];

/**
 * @enum {Number}
 */
export declare const operations: {
    UNION: number;
    DIFFERENCE: number;
    INTERSECTION: number;
    XOR: number;
};

export declare type Polygon = Ring[];

export declare type Position = [number, number];

export declare type Ring = Position[];

export declare function union(subject: Geometry, clipping: Geometry): Geometry | null;

export declare function xor(subject: Geometry, clipping: Geometry): Geometry | null;

export { }
