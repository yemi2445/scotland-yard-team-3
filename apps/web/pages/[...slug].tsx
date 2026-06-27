import { GetServerSideProps } from "next";

export default function CatchAll() {
    return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
    return {
        redirect: {
            destination: "/loading",
            permanent: false,
        },
    };
};
