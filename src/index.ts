const ROMAN_NUMERAL_MAP: [number, string][] = [
	[1000, "M"],
	[900, "CM"],
	[500, "D"],
	[400, "CD"],
	[100, "C"],
	[90, "XC"],
	[50, "L"],
	[40, "XL"],
	[10, "X"],
	[9, "IX"],
	[5, "V"],
	[4, "IV"],
	[1, "I"],
];

const FALLBACK_ABBREVIATION_LIST: string[] = ["K", "M", "B", "T", "Qd", "Qn", "Sx", "Sp", "Oc", "No", "De", "Ud", "Dd"];
const FALLBACK_BYTE_ABBREVIATION_LIST: string[] = ["Byte", "KB", "MB", "GB", "TB", "PB", "EP", "ZB", "YB"];

export class EasyAbbreviate {
	private cache = new Map<string, Map<number, string>>();

	private abbreviationList: string[];
	private byteAbbreviationList: string[];
	private decimalPlaces: number;

	public constructor(
		abbreviationList = FALLBACK_ABBREVIATION_LIST,
		byteAbbreviationList = FALLBACK_BYTE_ABBREVIATION_LIST,
		decimalPlaces = 2,
	) {
		this.abbreviationList = abbreviationList;
		this.byteAbbreviationList = byteAbbreviationList;
		this.decimalPlaces = decimalPlaces;
	}

	private getCorrectCache(): Map<number, string> {
		const [info] = debug.info(2, "n");
		const identifier = tostring(info);
		let cache = this.cache.get(identifier);

		if (!cache) {
			this.cache.set(identifier, new Map<number, string>());
			cache = this.cache.get(identifier)!;
		}

		return cache;
	}

	public ToAbbreviation(value: number): string {
		const cache = this.getCorrectCache();
		const cachedValue = cache.get(value);
		if (cachedValue !== undefined) return cachedValue;

		if (math.abs(value) < math.pow(10, 3)) return string.format(`%${this.decimalPlaces}f`, value);

		const [part] = tostring(value).match("%d+") as unknown as LuaTuple<[string]>;
		const index = math.min(math.floor(part.size() / 3.25), this.abbreviationList.size());
		const suffixValue = math.pow(10, index * 3);

		const finalValue: string = string.format(
			`%.${this.decimalPlaces}f${this.abbreviationList[index - 1] ?? ""}`,
			value / suffixValue,
		);

		cache.set(value, finalValue);

		return finalValue;
	}

	public ToComma(value: number): string {
		const cache = this.getCorrectCache();
		const cachedValue = cache.get(value);
		if (cachedValue !== undefined) return cachedValue;

		const [, , sign, part, decimal] = tostring(value).find("([-+]?)(%d+)([.]?%d*)") as unknown as LuaTuple<
			[unknown, unknown, string, string, string]
		>;
		const [newPart] = part.reverse().gsub("(%d%d%d)", "%1,") as unknown as LuaTuple<[string]>;
		const [result] = newPart.reverse().gsub("^,", "") as unknown as LuaTuple<[string]>;

		const finalValue: string = sign + result + decimal;

		cache.set(value, finalValue);

		return finalValue;
	}

	public ToByteAbbreviation(value: number): string {
		const cache = this.getCorrectCache();
		const cachedValue = cache.get(value);
		if (cachedValue !== undefined) return cachedValue;

		if (value === 0) return "0 Bytes";
		const k: number = 1024;
		const i: number = math.floor(math.log(value) / math.log(k));

		const finalValue: string = string.format(
			`%${this.decimalPlaces}f${this.byteAbbreviationList[i]}`,
			value / math.pow(k, i),
		);

		cache.set(value, finalValue);

		return finalValue;
	}

	public ToRomanNumeral(value: number): string {
		const cache = this.getCorrectCache();
		const cachedValue = cache.get(value);
		if (cachedValue !== undefined) return cachedValue;

		let romanNumeral = "";
		let calculateValue = value;

		while (calculateValue > 0) {
			for (const [_, part] of ipairs(ROMAN_NUMERAL_MAP)) {
				const romanCharacter = part[1] as string;
				const romanValue = part[0] as number;
				while (calculateValue >= romanValue) {
					romanNumeral += romanCharacter;
					calculateValue -= romanValue;
				}
			}
		}

		cache.set(value, romanNumeral);

		return romanNumeral;
	}

	public Flush(): void {
		this.cache.clear();
	}

	public Destroy(): void {
		this.cache.clear();
		table.clear(this);
		setmetatable(this, undefined!);
	}
}
