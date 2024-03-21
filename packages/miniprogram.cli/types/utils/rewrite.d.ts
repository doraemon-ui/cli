export declare function writeFile(filename: string, content: string): Promise<any>;
export declare function rewrite({ filePath, fileName, transformData, }: {
    filePath: string;
    fileName: string;
    transformData: (data: any) => string;
}): Promise<any>;
