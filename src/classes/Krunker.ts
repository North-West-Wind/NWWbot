// Copied from https://kr.vercel.app/guide#documentation

export interface Response {
    success: boolean // wether if it succeeded or not, if false check response.error, if true then check response.data
    data?: Profile | Clan // data on success
    error?: string // error message on fail
    time: number // time spent on generating the response
}

export interface Profile {
    username: string 
    id: number
    clan: string
    clanRank: number
    kills: number
    deaths: number
    wins: number
    score: number
    level: number
    levelPercentage: {
        percent: number
        current: number
        max: number
    }
    games: number
    funds: number
    hacker: boolean
    verified: boolean
    infected: boolean
    partner: number
    premium: number
    premiumName: string
    timePlayed: number
    createdAt: string
    stats?: object
    challenge: number
    twitch?: string
    elo?: number
    elo2?: number
    elo4?: number
    followers: number
    following: number
    region: number
    eventCount: number
    mods: {
        name: string
        votes: number
        featured?: number
    }[]
    maps: {
        name: string
        id: number
        info: object
        votes: number
        verified?: number
        createdAt: string
        creator: string
    }[]
    assets: {
        id: number
        name: string
        createdAt: string
        creator: string
        size: number // asset size in bytes
        data: object
        cat: number
        pri?: number
        fty?: string
    }[]
    skins: {}[]
}

export interface Clan {
    id: number
    name: string
    score: number
    level: number
    owner: string
    funds: number // krunkies
    contracts: number
    rank: number
    discord?: string // discord invite (ex: TkkqZyd)
    // 1-3 are not currently being used by krunker
    link1?: string
    link2?: string
    link3?: string
    members: {
        username: string
        score: number
        score7: number // score from the 7 days
        role: number
        hacker: boolean
        verified: boolean
        premium: boolean
        contract: {
            state: number // 0 no contract, 1 player in contract?, 2 player in contract?, 3 contract over (? means I am not sure)
            timeplayed: number
            kills: number
            deaths: number
            region: number
        }
        clanrank: number
        pr: number
    }[]
}