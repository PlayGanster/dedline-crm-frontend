import { useUserStore } from "../../model/user.store"

export const useUser = () => {
    const {
        user
    } = useUserStore();

    const getDataUserForAvatar = () => {
        if (!user) {
            return {
                first_name: '',
                last_name: '',
                avatar: ''
            }
        }
        return {
            first_name: user.first_name,
            last_name: user.last_name,
            avatar: user.avatar
        }
    }

    return {
        getDataUserForAvatar,
    }
}
