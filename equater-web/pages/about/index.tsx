import { NextPage } from 'next'
import * as React from 'react'
import Layout from '../../components/Layout'
import { BaseProps } from '../../types/BaseProps'

interface Props extends BaseProps {
    title: string
    subTitle: string
}

const AboutPage: NextPage<Props> = (props) => {
    return (
        <Layout>
            <div className={'ml-8 mr-8 mt-16 md:ml-64 md:mr-64 md:mt-32'}>
                <span className={'text-primary text-2xl md:text-3xl font-bold'}>Splitting the bill can be awkward</span>
                <p className={'text-secondary text-base md:text-xl text-left m-0 mt-4'}>
                    Let's face it, it sounds great to ask your friend to split the Netflix bill with you, but do you
                    really want to have nag that person every month for the $5 they owe you?
                </p>
                <p className={'text-secondary text-base md:text-xl text-left m-0 mt-4'}>
                    Rent costs a lot though. Surely, you'll make it a priority every month to get several hundred or
                    even thousands of dollars you're owed, right?
                </p>
                <p className={'text-secondary text-base md:text-xl text-left m-0 mt-4'}>
                    The real question you should be asking is, "Why should I have to do this in the first place??".
                </p>
                <p className={'text-secondary text-base md:text-xl text-left m-0 mt-4'}>
                    Guess what, now you don't. Equater makes sharing the easiest it's ever been.
                </p>
                <p className={'text-secondary text-base md:text-xl text-left m-0 mt-4'}>
                    What you want is an agreement - an agreement that's honored automatically by technology. A push
                    notification sounds a whole lot better than a menial recurring task, right?
                </p>
                <p className={'text-secondary text-base md:text-xl text-left m-0 mt-4'}>
                    With Equater, that's exactly what you get. It takes 2 minutes to sign up and split your first
                    expense, so what are you waiting for?
                </p>
                <p className={'text-secondary text-base md:text-xl text-left m-0 mt-4'}>
                    Oh, by the way, it's also completely <u>free</u> to use.
                </p>
            </div>
            <div className={'ml-8 mr-8 mt-16 md:ml-64 md:mr-64 md:mt-32'}>
                <span className={'text-primary text-2xl md:text-3xl font-bold'}>Core Values</span>
                <p className={'text-secondary text-base md:text-xl text-left m-0 mt-4'}>
                    We like to work with companies we trust, and we hope over time that we'll earn your trust. Here are
                    some of things we practice and preach every single day.
                </p>
                <span className={'block text-primary text-xl md:text-2xl font-bold mt-16'}>
                    Do whatever it takes for the customer
                </span>
                <p className={'text-secondary text-base md:text-xl text-left m-0 mt-2'}>
                    We enjoy helping people. It's in our nature. Even if we can't provide a solution for your needs,
                    we're happy to hop on the phone to figure out a tricky problem with you. Support is core to what we
                    do. Text us, call us, or email us if you prefer. We do our absolute best to help in you whatever way
                    we can.
                </p>
                <span className={'block text-primary text-xl md:text-2xl font-bold mt-16'}>
                    Build technology that we're excited to show to our friends
                </span>
                <p className={'text-secondary text-base md:text-xl text-left m-0 mt-2'}>
                    We live and breathe technology every day. We geek out over sleek user interfaces, high performance,
                    intuitive user experiences, and ultra reliable services. We don't ship code until we're proud to
                    show it off. Engineering isn't just a necessary evil for us, it's a passion and a craft that we
                    absolutely love.
                </p>
                <span className={'block text-primary text-xl md:text-2xl font-bold mt-16'}>
                    Do right by the people we work with
                </span>
                <p className={'text-secondary text-base md:text-xl text-left m-0 mt-2'}>
                    We spend an incredible amount of our lives working. We want to work with happy and driven people. In
                    order to attract those types of people you have to do right by them. You have to demonstrate the
                    kind of values that inspire them to work alongside you. We don't want to monitor your time as you
                    clock in and clock out, we want to empower you to create your best work and then celebrate the heck
                    out of your accomplishments. Interested in working with us? Send us a text at the number below!
                </p>
                <p className={'text-secondary text-base md:text-xl text-left m-0 mt-8'}>
                    {`If you've read this far, first of all thank you for checking us out! We'd love to hear from you.
                    Send us a text at ${process.env.NEXT_PUBLIC_SUPPORT_PHONE_NUMBER}. We promise not to leave you hanging!`}
                </p>
                <div className={'mt-16 mb-16'}>
                    <span className={'block text-secondary text-base md:text-xl text-left mt-8'}>Much Love,</span>
                    <span className={'block text-secondary text-base md:text-xl text-left'}>
                        Robert Menke · Founder of Equater
                    </span>
                </div>
            </div>
        </Layout>
    )
}

export default AboutPage
