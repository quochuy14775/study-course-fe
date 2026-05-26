export interface ODataParams {
    top?: number;
    skip?: number;
    filter?: string;
    orderby?: string;
    count?: boolean;
}
export const ITEMS_PER_PAGE = 10;
export const buildODataQuery = (params: ODataParams): string => {
    const parts: string[] = [];
    if (params.count)    parts.push(`$count=true`);
    if (params.top)      parts.push(`$top=${params.top}`);
    if (params.skip)     parts.push(`$skip=${params.skip}`);
    if (params.filter)   parts.push(`$filter=${encodeURIComponent(params.filter)}`);
    if (params.orderby)  parts.push(`$orderby=${params.orderby}`);
    return parts.join('&');
};