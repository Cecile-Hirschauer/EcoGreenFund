"use client"
import Header from '../Header/Header'
import Footer from '../Footer/Footer'
import { Flex } from '@chakra-ui/react'

const Layout = ({ children }) => {
    return (
        <Flex
            direction="column"
            justifyContent="center"
        >
            <Header />
            <Flex
                grow="1"
                p="2rem"
            >
                {children}
            </Flex>
            <Footer />
        </Flex>
    )
}

export default Layout