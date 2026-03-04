import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "../../lib/hooks/user.hook"

const UserAvatar = () => {
    const {
        getDataUserForAvatar
    } = useUser();

    const data = getDataUserForAvatar();

    return (
        <div
            className="
                flex
                gap-3
                items-center
                cursor-pointer
            "
        >
            <Avatar>
                <AvatarImage
                src={data.avatar}
                alt={`${data.first_name} ${data.last_name}`}
                className="grayscale"
                />
                <AvatarFallback>{data.first_name[0]}{data.last_name[0]}</AvatarFallback>
            </Avatar>
            <p
                className="
                    text-[14px]
                    max-[1024px]:hidden
                "
            >
                {data.first_name} {data.last_name}
            </p>
        </div>
    )
}

export default UserAvatar
