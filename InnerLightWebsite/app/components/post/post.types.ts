export interface ModerationResponse {
    flagged: boolean;
    categories: {
        hate: boolean;
        ["hate/threatening"]: boolean;
        ["self-harm"]: boolean;
        ["sexual"]: boolean;
        ["sexual/minors"]: boolean;
        violence: boolean;
        ["violence/graphic"]: boolean;
    };
}

export interface NewPost {
    title: string;
    description: string;
    image: File | null | undefined;
    gif: File | null | undefined;
    user_id: string;
}
