type Channel = {
    id: string;
    name: string | null;
    user_channels: {
        user_id: string;
    }[];
}