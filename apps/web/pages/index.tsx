import { GetServerSideProps } from "next";

export default function Index() {
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
